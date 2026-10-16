// @ts-nocheck
import flatten from 'flat';
import { constants } from "@racehub-io/f1game-udp-parser";

const { PACKETS } = constants.F12021;

const flattenRecord = (packetType, packet, carIndex) => {
  switch (packetType) {
    case PACKETS.Session: {
      const record = {
        packetType,
        ...flatten(packet.m_header),
        "m_weather": packet.m_weather,
        "m_trackTemperature": packet.m_trackTemperature,
        "m_airTemperature": packet.m_airTemperature,
        "m_totalLaps": packet.m_totalLaps,
        "m_trackLength": packet.m_trackLength,
        "m_sessionType": packet.m_sessionType,
        "m_trackId": packet.m_trackId,
        "m_formula": packet.m_formula,
        "m_sessionTimeLeft": packet.m_sessionTimeLeft,
        "m_sessionDuration": packet.m_sessionDuration,
        "m_pitSpeedLimit": packet.m_pitSpeedLimit,
        "m_gamePaused": packet.m_gamePaused,
        "m_isSpectating": packet.m_isSpectating,
        "m_spectatorCarIndex": packet.m_spectatorCarIndex,
        "m_sliProNativeSupport": packet.m_sliProNativeSupport,
        "m_numMarshalZones": packet.m_numMarshalZones,
        "m_marshalZones": flatten(packet.m_marshalZones),
        "m_safetyCarStatus": packet.m_safetyCarStatus,
        "m_networkGame": packet.m_networkGame,
        "m_numWeatherForecastSamples": packet.m_numWeatherForecastSamples,
        "m_weatherForecastSamples": flatten(packet.m_weatherForecastSamples)
      };
      return record;
    };
    case PACKETS.Motion: {
      let record = { packetType, ...flatten(packet.m_header), ...flatten(packet.m_carMotionData[carIndex]) };
      if (carIndex == packet.m_header.m_playerCarIndex) {
        record = {
          ...record,
          "m_suspensionPosition.FL": packet.m_suspensionPosition[2],
          "m_suspensionPosition.FR": packet.m_suspensionPosition[3],
          "m_suspensionPosition.RL": packet.m_suspensionPosition[0],
          "m_suspensionPosition.RR": packet.m_suspensionPosition[1],
          "m_suspensionVelocity.FL": packet.m_suspensionVelocity[2],
          "m_suspensionVelocity.FR": packet.m_suspensionVelocity[3],
          "m_suspensionVelocity.RL": packet.m_suspensionVelocity[0],
          "m_suspensionVelocity.RR": packet.m_suspensionVelocity[1],
          "m_suspensionAcceleration.FL": packet.m_suspensionAcceleration[2],
          "m_suspensionAcceleration.FR": packet.m_suspensionAcceleration[3],
          "m_suspensionAcceleration.RL": packet.m_suspensionAcceleration[0],
          "m_suspensionAcceleration.RR": packet.m_suspensionAcceleration[1],
          "m_wheelSpeed.FL": packet.m_wheelSpeed[2],
          "m_wheelSpeed.FR": packet.m_wheelSpeed[3],
          "m_wheelSpeed.RL": packet.m_wheelSpeed[0],
          "m_wheelSpeed.RR": packet.m_wheelSpeed[1],
          "m_wheelSlip.FL": packet.m_wheelSlip[2],
          "m_wheelSlip.FR": packet.m_wheelSlip[3],
          "m_wheelSlip.RL": packet.m_wheelSlip[0],
          "m_wheelSlip.RR": packet.m_wheelSlip[1],
          "m_localVelocityX": packet.m_localVelocityX,
          "m_localVelocityY": packet.m_localVelocityY,
          "m_localVelocityZ": packet.m_localVelocityZ,
          "m_angularVelocityX": packet.m_angularVelocityX,
          "m_angularVelocityY": packet.m_angularVelocityY,
          "m_angularVelocityZ": packet.m_angularVelocityZ,
          "m_angularAccelerationX": packet.m_angularAccelerationX,
          "m_angularAccelerationY": packet.m_angularAccelerationY,
          "m_angularAccelerationZ": packet.m_angularAccelerationZ,
          "m_frontWheelsAngle": packet.m_frontWheelsAngle,
        }
      };
      return record;
    };
    case PACKETS.Event: return { packetType, ...flatten(packet.m_header), m_eventStringCode: packet.m_eventStringCode };
    case PACKETS.LapData: return { packetType, ...flatten(packet.m_header), ...flatten(packet.m_lapData[carIndex]) };
    case PACKETS.Participants: return { packetType, ...flatten(packet.m_header), m_numActiveCars: packet.m_numActiveCars, ...flatten(packet.m_participants[carIndex]) };
    case PACKETS.CarSetups: return { packetType, ...flatten(packet.m_header), ...flatten(packet.m_carSetups[carIndex]) };
    case PACKETS.CarTelemetry: return { packetType, ...flatten(packet.m_header), m_buttonStatus: packet.m_buttonStatus, ...flatten(packet.m_carTelemetryData[carIndex]) };
    case PACKETS.CarStatus: return { packetType, ...flatten(packet.m_header), ...flatten(packet.m_carStatusData[carIndex]) };
    case PACKETS.FinalClassification: return { packetType, ...flatten(packet.m_header), packet };
    case PACKETS.LobbyInfo: return { packetType, ...flatten(packet.m_header), m_numPlayers: packet.m_numPlayers, ...flatten(packet.m_lobbyPlayers[carIndex]) };
    case PACKETS.CarDamage: return { packetType, ...flatten(packet.m_header), ...flatten(packet.m_carDamageData[carIndex]) };
    case PACKETS.SessionHistory: return { packetType, ...flatten(packet.m_header), m_carIdx: packet.m_carIdx, m_numLaps: packet.m_numLaps, m_numTyreStints: packet.m_numTyreStints };
    default: return {};
  }
}

export default flattenRecord;
