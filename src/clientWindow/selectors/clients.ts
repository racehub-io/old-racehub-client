export const getClients = state => state.clients.byId;

export const getClientIsConnected = (state, clientId) => state.clients.byId[clientId].isConnected;

export const getClientLastMessage = (state, clientId) => state.clients.byId[clientId].lastMessage;

export const getClientMessageCount = (state, clientId) => state.clients.byId[clientId].messageCount;
