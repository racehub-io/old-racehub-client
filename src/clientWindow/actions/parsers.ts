export const ADD_PARSER = 'ADD_PARSER';
export const REMOVE_PARSER = 'REMOVE_PARSER';
export const UPDATE_PARSER_PROGRESS = 'UPDATE_PARSER_PROGRESS';

export const addParser = (parserId, filepath) => {
  return {
    type: ADD_PARSER,
    payload: { parserId, filepath }
  };
}

export const removeParser = parserId => {
  return {
    type: REMOVE_PARSER,
    payload: { parserId }
  };
}

export const updateParserProgress = (parserId, progress) => {
  return {
    type: UPDATE_PARSER_PROGRESS,
    payload: { parserId, progress }
  };
}
