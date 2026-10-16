import { Action, combineReducers } from 'redux';
import produce from 'immer';
import { ADD_PARSER, REMOVE_PARSER, UPDATE_PARSER_PROGRESS } from '../actions/parsers';

const parserById = (state = {}, action: Action) =>
  produce(state, draft => {
    switch (action.type) {
      case ADD_PARSER: {
        const { parserId, filepath } = action.payload;
        draft[parserId] = {
          parserId,
          filepath,
          progress: 0
        };
        break;
      }
      case REMOVE_PARSER: {
        const { parserId } = action.payload;
        delete draft[parserId];
        break;
      }
      case UPDATE_PARSER_PROGRESS: {
        const { parserId, progress } = action.payload;
        draft[parserId].progress = progress;
        break;
      }
      default: return draft;
    }
  });

function addParserId(state, action: Action) {
  const { parserId } = action.payload;

  return state.concat(parserId);
}

function removeParserId(state, action: Action) {
  const { parserId } = action.payload;

  return state.filter(id => id !== parserId);
}

function allParsers(state = [], action: Action) {
  switch (action.type) {
    case ADD_PARSER:
      return addParserId(state, action);
    case REMOVE_PARSER:
      return removeParserId(state, action);
    default:
      return state;
  }
}

export default combineReducers({
  byId: parserById,
  allIds: allParsers
});
