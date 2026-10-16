// @ts-nocheck
import { ipcRenderer, remote } from 'electron';
import { TelemetryClient, constants } from '@racehub-io/f1game-udp-parser';
import path from 'path';
import { throttle } from 'lodash';

import { nanoid } from 'nanoid';
import fs from 'fs';
import zlib from 'zlib';
import flattenRecord from './flattenRecord';
const { getPacketSize, parseBufferMessage } = TelemetryClient;
const {
  DRIVERS,
  FORMULAS,
  NATIONALITIES,
  PACKETS,
  SESSION_TYPES,
  TEAMS,
  TRACKS,
  TYRES
} = constants.F12021;

const { app } = remote;

BigInt.prototype.toJSON = function() { return this.toString()  }

function readUInt16LE(buffer: Buffer, offset: number) {
  return buffer[offset] | (buffer[offset + 1] << 8);
}

function readUInt8(buffer: Buffer, offset: number) {
  return buffer[offset];
}

export default class F1Parser {
  constructor(parserId, filepath) {
    this.parserId = parserId;
    this.filepath = filepath;
    this.buffer = this.readFile();
    this.outputPath = this.createOutputPath();
    this.throttled_updateProgress = throttle(this.updateProgress, 50);
  }

  updateProgress(progress) {
    ipcRenderer.send('PARSER_PROGRESS', this.parserId, progress);
  }

  readFile() {
    const { filepath } = this;
    const rawData = fs.readFileSync(filepath);
    const inflatedBuffer = Buffer.from(rawData);
    const buffer = zlib.unzipSync(inflatedBuffer);
    return buffer;
  }

  createOutputPath() {
    const recorderId = path.basename(this.filepath, '.rhc');
    const outputPath = path.join(app.getPath('documents'), 'Racehub', recorderId);
    fs.mkdirSync(outputPath, {recursive: true});
    return outputPath
  }

  createWriter(filename: string, gzip: boolean = true) {
    if (gzip) {
      return this.createGzipWriter(filename);
    } else {
      return this.createVerboseWriter(filename);
    }
  }

  createGzipWriter(filename: string) {
    const { outputPath } = this;
    const writer = zlib.createGzip();
    const filepath = `${outputPath}/${filename}.json.gz`;
    writer.pipe(fs.createWriteStream(filepath));
    return { writer, filepath, filename };
  }

  createVerboseWriter(filename: string) {
    const { outputPath } = this;
    const filepath = `${outputPath}/${filename}.json`;
    const writer = fs.createWriteStream(filepath);
    return { writer, filepath, filename };
  }

  lapPerFile() {
    const { buffer } = this;

    const parsedLaps = [];

    const getWriterEndMessage = (index) => {
      const currentLap = currentLaps[index];
      const { participant, lap } = currentLap;
      return `{"timestamp": ${Date.now()}, "packetType": "lapEnd"}],"session":${JSON.stringify(currentSession)},"participant":${JSON.stringify(participant)},"lap":${JSON.stringify(lap)}}`
    }

    const createParsedFilepath = (index, lapId) => {
      const { outputPath } = this;
      const currentLap = currentLaps[index];
      const { participant, lap } = currentLap;
      return `${outputPath}/${currentSession.trackName} ${currentSession.sessionType} ${participant.abbreviation} ${participant.raceNumber} L${lap.lapNumber} ${lap.lapTime} ${participant.aiControlled ? "AI" : ""} ${lap.isValid ? "" : "Invalid"} ${lapId}.json.gz`;
    }

    const writers = Array(22).fill(null).map(n => ({
      writer: null,
      filepath: null,
      lapId: null,
      currentLapDistance: 0,
    }));

    const currentSession = {
      sessionUID: null,
      trackName: null,
      trackLength: null,
      sessionType: null,
      totalLaps: null,
      formula: null,
      trackTemperature: null,
      airTemperature: null,
    };

    const currentLaps = Array(22).fill(null).map(n => ({
      participant: {
        aiControlled: null,
        name: null,
        firstName: null,
        lastName: null,
        abbreviation: null,
        nationality: null,
        teamName: null,
        raceNumber: null,
      },
      lap: {
        isValid: false,
        lapTime: null,
        driverStatus: null,
        resultStatus: null,
        position: null,
        fuelLoad: null,
        tyreCompound: null,
        lapType: null, //inlap, outlap, flying lap etc.
        lapDistance: 0,
      }
    }));

    let offset = 0;
    let lastPacketSessionUID = null;

    while (offset < buffer.length) {
      const m_packetFormat = readUInt16LE(buffer, offset);
      const m_packetType =
        m_packetFormat === 2018
          ? readUInt8(buffer, offset + 3)
          : readUInt8(buffer, offset + 5);
      const packetSize = getPacketSize(m_packetFormat, m_packetType);
      const parsedMessage = parseBufferMessage(
        buffer.slice(offset, offset + packetSize),
        true
      );

      const { packetType } = parsedMessage;
      const packetData = parsedMessage?.packetData;

      const packetSessionUID = packetData.m_header.m_sessionUID;

      if (packetSessionUID !== lastPacketSessionUID) {
        // new session
        // close all previous writers
        writers.forEach((w, index) => {
          if (w.writer) {
            parsedLaps.push([w.filepath, createParsedFilepath(index, w.lapId)]);
            w.writer.end(`${getWriterEndMessage(index)}`);
            w.writer = null;
          };
          const lapId = nanoid();
          const { writer, filepath } = this.createWriter(lapId, true);
          w.writer = writer;
          w.filepath = filepath;
          w.lapId = lapId;
          w.writer.write(`{"records": [{"timestamp": ${Date.now()}, "packetType": "lapStart"},`);
        });
      };

      if (packetType === PACKETS.LapData) {
        writers.forEach((w, index) => {
          if ((packetData.m_lapData[index].m_lapDistance < 100) && (w.currentLapDistance > 100) || (packetData.m_lapData[index].m_lapDistance > 0) && (w.currentLapDistance < 0)) {
            parsedLaps.push([w.filepath, createParsedFilepath(index, w.lapId)]);
            w.writer.end(`${getWriterEndMessage(index)}`);
            const lapId = nanoid();
            const { writer, filepath } = this.createWriter(lapId, true);
            w.writer = writer;
            w.filepath = filepath;
            w.lapId = lapId;
            w.writer.write(`{"records": [{"timestamp": ${Date.now()}, "packetType": "lapStart"},`);
          }
          w.currentLapDistance = packetData.m_lapData[index].m_lapDistance;
        })
      }

      writers.forEach((w, index) => {
        const flatPacket = flattenRecord(packetType, packetData, index);
        flatPacket.distance = currentLaps[index].lap.lapDistance;
        w.writer.write(`${JSON.stringify(flatPacket)},`);
      });

      switch(packetType) {
        case PACKETS.LapData: {
          currentLaps.forEach((c, index) => {
            c.lap.isValid = !packetData.m_lapData[index].m_currentLapInvalid;
            c.lap.lapTime = packetData.m_lapData[index].m_currentLapTimeInMS;
            c.lap.lapNumber = packetData.m_lapData[index].m_currentLapNum;
            c.lap.driverStatus = packetData.m_lapData[index].m_driverStatus;
            c.lap.resultStatus = packetData.m_lapData[index].m_resultStatus;
            c.lap.position = packetData.m_lapData[index].m_carPosition;
            c.lap.lapDistance = packetData.m_lapData[index].m_lapDistance;
          })
          break;
        };
        case PACKETS.Participants: {
          currentLaps.forEach((c, index) => {
            const driverId = packetData.m_participants[index].m_driverId;
            const driver = (driverId in DRIVERS) ? DRIVERS[driverId] : {firstName: "firstName", lastName: "lastName", abbreviation: "DRV"};
            const nationality = NATIONALITIES[packetData.m_participants[index].m_nationality-1];
            const teamId = packetData.m_participants[index].m_teamId;
            const team = (teamId in TEAMS) ? TEAMS[teamId] : {name: "Team", color: "#FFFFFF"};
            c.participant.aiControlled = !!packetData.m_participants[index].m_aiControlled;
            c.participant.name = packetData.m_participants[index].m_name;
            c.participant.firstName = driver.firstName;
            c.participant.lastName = driver.lastName;
            c.participant.abbreviation = driver.abbreviation;
            c.participant.nationality = nationality;
            c.participant.teamName = team.name;
            c.participant.raceNumber = packetData.m_participants[index].m_raceNumber;
          });
          break;
        };
        case PACKETS.Session: {
          const formula = FORMULAS[packetData.m_formula]
          const sessionType = SESSION_TYPES[packetData.m_sessionType];
          const track = TRACKS[packetData.m_trackId];
          currentSession.sessionUID = packetData.m_header.m_sessionUID;
          currentSession.trackName = track.name;
          currentSession.trackLength = packetData.m_trackLength;
          currentSession.sessionType = sessionType;
          currentSession.totalLaps = packetData.m_totalLaps;
          currentSession.formula = formula;
          currentSession.trackTemperature = packetData.m_trackTemperature;
          currentSession.airTemperature = packetData.m_airTemperature;
          break;
        };

        case PACKETS.CarStatus: {
          currentLaps.forEach((c, index) => {
            const tyre = TYRES[packetData.m_carStatusData[index].m_actualTyreCompound];
            c.lap.fuelLoad = packetData.m_carStatusData[index].m_fuelInTank;
            c.lap.tyreCompound = tyre.name;
          });
          break;
        };
        default: {
          break;
        };
      };

      offset += packetSize;

      this.throttled_updateProgress((((offset/buffer.length)*100)/2).toFixed(1));

      lastPacketSessionUID = packetSessionUID;
    }

    writers.forEach((w, index) => {
      if (w.writer) {
        parsedLaps.push([w.filepath, createParsedFilepath(index, w.lapId)]);
        w.writer.end(`${getWriterEndMessage(index)}`);
      };
    });

    parsedLaps.forEach(p => fs.rename(p[0], p[1], (err) => {if(err) {console.log(err);}}));
  }
}
