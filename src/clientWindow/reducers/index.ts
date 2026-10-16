import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
import clients from './clients';
import parsers from './parsers';

export function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    clients,
    parsers,
  });
}

export type RootState = ReturnType<ReturnType<typeof createRootReducer>>;
