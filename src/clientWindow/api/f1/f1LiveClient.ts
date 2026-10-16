import BaseClient from '../baseClient';
import clientTypes from '../../../constants/clientTypes.json';
import userSettings from '../../../userSettings';

export default class F1LiveClient extends BaseClient {

  constructor() {
    const receivePort = userSettings.get('recorders_F1_inport');
    const forwardPort = userSettings.get('recorders_F1_outport');
    const verbose = true;
    super({receivePort, forwardPort, verbose});
    this.clientType = clientTypes.F1;
  }
}
