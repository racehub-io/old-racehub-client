import { Action, combineReducers } from 'redux';
import produce from 'immer';
import { ADD_CLIENT, REMOVE_CLIENT, CONNECT, DISCONNECT, UPDATE_RECORDER_INFO } from '../actions/clients';

const clientById = (state = {}, action: Action) =>
  produce(state, draft => {
    switch (action.type) {
      case ADD_CLIENT: {
        const { clientId, clientType } = action.payload;
        draft[clientId] = {
          clientId,
          clientType,
          isConnected: false,
          lastMessage: null,
          messageCount: null
        };
        break;
      }
      case REMOVE_CLIENT: {
        const { clientId } = action.payload;
        delete draft[clientId];
        break;
      }
      case CONNECT: {
        const { clientId } = action.payload;
        draft[clientId].isConnected = true;
        draft[clientId].lastMessage = null;
        draft[clientId].messageCount = null;
        break;
      }
      case DISCONNECT: {
        const { clientId } = action.payload;
        draft[clientId].isConnected = false;
        draft[clientId].lastMessage = null;
        draft[clientId].messageCount = null;
        break;
      }
      case UPDATE_RECORDER_INFO: {
        const { clientId, lastMessage, messageCount } = action.payload;
        draft[clientId].lastMessage = lastMessage;
        draft[clientId].messageCount = messageCount;
        break;
      }
      default: return draft;
    }
  });

function addClientId(state, action: Action) {
  const { clientId } = action.payload;

  return state.concat(clientId);
}

function removeClientId(state, action: Action) {
  const { clientId } = action.payload;

  return state.filter(id => id !== clientId);
}

function allClients(state = [], action: Action) {
  switch (action.type) {
    case ADD_CLIENT:
      return addClientId(state, action);
    case REMOVE_CLIENT:
      return removeClientId(state, action);
    default:
      return state;
  }
}

export default combineReducers({
  byId: clientById,
  allIds: allClients
});
