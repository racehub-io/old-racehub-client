// @ts-nocheck
import { ipcRenderer, remote } from 'electron';
import { TelemetryClient, constants } from '@racehub-io/f1game-udp-parser';
import path from 'path';
import { throttle } from 'lodash';
import { nanoid } from 'nanoid';

import fs from 'fs';
import zlib from 'zlib';
import { ParquetWriter, ParquetSchema } from 'parquets';
import { createMessage } from './createMessage';
import { createSchema } from './createParquetSchema';
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

function readUInt16LE(buffer: Buffer, offset: number) {
  return buffer[offset] | (buffer[offset + 1] << 8);
}

function readUInt8(buffer: Buffer, offset: number) {
  return buffer[offset];
}

const schema = new ParquetSchema(createSchema());

export default class F1ParquetParser {
  constructor(parserId, filepath) {
    this.parserId = parserId;
    this.filepath = filepath;
    this.buffer = this.readFile();
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

  createWriter(sessionUID, participantIndex) {
    const recorderId = path.basename(this.filepath, '.rhc');
    const outputPath = path.join(app.getPath('documents'), 'Racehub', recorderId, `${sessionUID}`);
    fs.mkdirSync(outputPath, { recursive: true });
    return ParquetWriter.openFile(schema, `${outputPath}/${participantIndex}.parquet`);
  }

  async participantPerFile() {
    const { buffer } = this;
    const writers = {};
    let offset = 0;
    let uniqueSessionID = nanoid();
    let lastPacketSessionUID = null;

    const getMetaInformation = (session, carIndex) => {
      const laps = session.laps[carIndex];
      return { laps }
    }

    const writeMetaInformation = (writer, laps) => {
      writer.setMetadata('laps', JSON.stringify(laps));
    };

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

      const { packetType, packetData } = parsedMessage;

      const packetSessionUID = packetData.m_header.m_sessionUID;

      if (packetSessionUID === 0) {
        lastPacketSessionUID = packetSessionUID;
        // next packet
        offset += packetSize;
        this.throttled_updateProgress(((offset / buffer.length) * 100).toFixed(1));
        continue;
      }

      // new session, close current writers and create new ones
      if (lastPacketSessionUID !== packetSessionUID) {
        uniqueSessionID = nanoid();
        writers[uniqueSessionID] = {
          parquetHandles: [],
          frameIdentifier: null,
          sessionTime: 0,
          uniqueSessionID,
          currentLapNumbers: Array(22).fill(0),
          laps: Array(22).fill([]),
          latestPackets: {
            [PACKETS.Motion]: null,
            [PACKETS.Session]: null,
            [PACKETS.LapData]: null,
            [PACKETS.Participants]: null,
            [PACKETS.CarSetups]: null,
            [PACKETS.CarTelemetry]: null,
            [PACKETS.CarStatus]: null,
            [PACKETS.CarDamage]: null,
            [PACKETS.SessionHistory]: null,
          },
          previousPacket: null
        };
        const createWriterPromises = Array(22).fill(null).map((_, index) => {
          return this.createWriter(uniqueSessionID, index)
        });
        writers[uniqueSessionID].parquetHandles = await Promise.all(createWriterPromises);
      }

      const sessionWriters = writers[uniqueSessionID];
      const latestPackets = sessionWriters.latestPackets;
      const previousPacket = sessionWriters.previousPacket;

      if (packetData.m_header.m_frameIdentifier !== sessionWriters.frameIdentifier) {
        //write a row
        if (!Object.values(latestPackets).some(v => v === null)) {
          const writeMessagePromises = sessionWriters.parquetHandles.map((w, index) => {
            const motionData = latestPackets[PACKETS.Motion].packetData.m_carMotionData[index];
            const sessionData = latestPackets[PACKETS.Session].packetData;
            const lapData = latestPackets[PACKETS.LapData].packetData.m_lapData[index];
            const participantData = latestPackets[PACKETS.Participants].packetData.m_participants[index];
            const setupData = latestPackets[PACKETS.CarSetups].packetData.m_carSetups[index];
            const telemetryData = latestPackets[PACKETS.CarTelemetry].packetData.m_carTelemetryData[index];
            const statusData = latestPackets[PACKETS.CarStatus].packetData.m_carStatusData[index];
            const damageData = latestPackets[PACKETS.CarDamage].packetData.m_carDamageData[index];
            const isPlayerIdx = index === packetData.m_header.m_playerCarIndex;
            const message = createMessage(motionData, sessionData, lapData, participantData, setupData, telemetryData, statusData, damageData);
            return w.appendRow({
              frameID: sessionWriters.frameIdentifier ? sessionWriters.frameIdentifier : 0,
              sessionTime: sessionWriters.sessionTime,
              sessionID: `${packetSessionUID}`,
              uniqueSessionID: sessionWriters.uniqueSessionID,
              playerCarIndex: packetData.m_header.m_playerCarIndex,
              carIndex: index,
              calculated_lap_number: sessionWriters.currentLapNumbers[index],
              wheel_speed_FL: isPlayerIdx ? latestPackets[PACKETS.Motion].packetData.m_wheelSpeed[2] : 0,
              wheel_speed_FR: isPlayerIdx ? latestPackets[PACKETS.Motion].packetData.m_wheelSpeed[3] : 0,
              wheel_speed_RL: isPlayerIdx ? latestPackets[PACKETS.Motion].packetData.m_wheelSpeed[0] : 0,
              wheel_speed_RR: isPlayerIdx ? latestPackets[PACKETS.Motion].packetData.m_wheelSpeed[1] : 0,
              wheel_slip_FL: isPlayerIdx ? latestPackets[PACKETS.Motion].packetData.m_wheelSlip[2] : 0,
              wheel_slip_FR: isPlayerIdx ? latestPackets[PACKETS.Motion].packetData.m_wheelSlip[3] : 0,
              wheel_slip_RL: isPlayerIdx ? latestPackets[PACKETS.Motion].packetData.m_wheelSlip[0] : 0,
              wheel_slip_RR: isPlayerIdx ? latestPackets[PACKETS.Motion].packetData.m_wheelSlip[1] : 0,
              racing_line: isPlayerIdx ? sessionData.m_dynamicRacingLine : 0,
              racing_line_type: isPlayerIdx ? sessionData.m_dynamicRacingLineType : 0,
              ...message,
            });
          });
          await Promise.all(writeMessagePromises);
        }
      }

      if (packetType === PACKETS.LapData && latestPackets[PACKETS.LapData]) {
        writers[uniqueSessionID].currentLapNumbers = writers[uniqueSessionID].currentLapNumbers.map((currentLapNumber, index) => {
          const lapData = latestPackets[PACKETS.LapData].packetData.m_lapData[index];
          if ((packetData.m_lapData[index].m_lapDistance < 100) && (lapData.m_lapDistance > 100) || (packetData.m_lapData[index].m_lapDistance > 0) && (lapData.m_lapDistance < 0)) {
            return currentLapNumber + 1;
          } else {
            return currentLapNumber;
          }
        })
      }

      if (packetType === PACKETS.SessionHistory) {
        const carIndex = packetData.m_carIdx;
         writers[uniqueSessionID].laps[carIndex] = packetData.m_lapHistoryData.slice(0, packetData.m_numLaps);
      };

      writers[uniqueSessionID].latestPackets[packetType] = parsedMessage;

      writers[uniqueSessionID].previousPacket = parsedMessage;
      writers[uniqueSessionID].frameIdentifier = packetData.m_header.m_frameIdentifier;
      writers[uniqueSessionID].sessionTime = packetData.m_header.m_sessionTime;

      lastPacketSessionUID = packetSessionUID;

      // next packet
      offset += packetSize;

      this.throttled_updateProgress(((offset / buffer.length) * 100).toFixed(1));
    }

    // close all writers
    Object.values(writers).forEach(session => {
      session.parquetHandles.forEach((writer, carIndex) => {
        const { laps } = getMetaInformation(session, carIndex);
        writeMetaInformation(writer, laps);
      })
    })
    const closeWriterPromises = Object.values(writers).map(w => w.parquetHandles).flat().map(writer => writer.close());
    await Promise.all(closeWriterPromises);
  }
}
