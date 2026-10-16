import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';

export function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
  });
}

export type RootState = ReturnType<ReturnType<typeof createRootReducer>>;
