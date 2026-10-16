import Store from 'electron-store';

const schema = {
  recorders_F1_inport: {
    type: 'number',
    maximum: 65535,
    minimum: 1,
    default: 30501
  },
  recorders_F1_outport: {
    type: 'number',
    maximum: 65535,
    minimum: 1,
    default: 30500
  },
  recorders_F1_auto_start: {
    type: 'boolean',
    default: false
  },
  recorders_RFACTOR2_inport: {
    type: 'number',
    maximum: 65535,
    minimum: 1,
    default: 20888
  },
  recorders_RFACTOR2_outport: {
    type: 'number',
    maximum: 65535,
    minimum: 1,
    default: 20889
  },
  recorders_RFACTOR2_auto_start: {
    type: 'boolean',
    default: false
  },
};

const userSettings = new Store({schema});

export default userSettings
