export const getParsers = state => state.parsers.byId;

export const getParserFilepath = (state, parserId) => state.parsers.byId[parserId].filepath;

export const getParserProgress = (state, parserId) => state.parsers.byId[parserId].progress;
