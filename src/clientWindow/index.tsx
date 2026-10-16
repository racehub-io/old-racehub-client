import { ipcRenderer } from 'electron';
import React from 'react';
import { render } from 'react-dom';
import { history } from './store/configureStore';
import { store } from './store/store';
import { addClient } from './actions/clients';
import { addParser, updateParserProgress } from './actions/parsers';
import clients from './api/index';
import userSettings from '../userSettings';
import Root from './Root';

ipcRenderer.on('CLIENTS', (event, arg) => {
  switch (arg) {
    case 'INITIALISE': {
      // add clients
      Object.values(clients).map(client => {
        const { clientId, clientType } = client;
        store.dispatch(addClient(clientId, clientType));
        userSettings.get(`recorders_${clientType}_auto_start`) ? client.connect() : null;
      });
      break;
    }
    default: return;
  }
})

ipcRenderer.on('ADD_PARSER', (_, parserId, filepath) => {
  store.dispatch(addParser(parserId, filepath));
});

ipcRenderer.on('PARSER_PROGRESS', (_, parserId, progress) => {
  store.dispatch(updateParserProgress(parserId, progress));
});

render(
  <Root store={store} history={history} />,
  document.getElementById('root')
);
