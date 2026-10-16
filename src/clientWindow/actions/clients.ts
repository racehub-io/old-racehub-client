export const ADD_CLIENT = 'ADD_CLIENT';
export const REMOVE_CLIENT = 'REMOVE_CLIENT';
export const CONNECT = 'CONNECT';
export const DISCONNECT = 'DISCONNECT';
export const UPDATE_RECORDER_INFO = 'UPDATE_RECORDER_INFO';

export const addClient = (clientId, clientType) => {
  return {
    type: ADD_CLIENT,
    payload: { clientId, clientType }
  };
}

export const removeClient = clientId => {
  return {
    type: REMOVE_CLIENT,
    payload: { clientId }
  };
}

export const clientConnect = clientId => {
  return {
    type: CONNECT,
    payload: { clientId }
  };
}

export const clientDisconnect = clientId => {
  return {
    type: DISCONNECT,
    payload: { clientId }
  };
}

export const clientUpdateRecorderInfo = (clientId, recorderInfo) => {
  const { lastMessage, messageCount } = recorderInfo;
  return {
    type: UPDATE_RECORDER_INFO,
    payload: {
      clientId,
      lastMessage,
      messageCount
    }
  };
}
