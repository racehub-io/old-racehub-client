import BaseClient from '../baseClient';
import clientTypes from '../../../constants/clientTypes.json';
import userSettings from '../../../userSettings';

export default class RFactor2LiveClient extends BaseClient {

  constructor() {
    const receivePort = userSettings.get('recorders_RFACTOR2_inport');
    const forwardPort = userSettings.get('recorders_RFACTOR2_outport');
    const verbose = true;
    super({receivePort, forwardPort, verbose});
    this.clientType = clientTypes.RFACTOR2;
  }
}
