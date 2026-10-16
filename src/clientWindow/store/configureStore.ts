import { compose, createStore } from 'redux';

import { createHashHistory } from 'history';

import { createRootReducer } from '../reducers';

const isDev = process.env.NODE_ENV === 'development';
const anyWindow = window as any;

const composeEnhancers =
    isDev && anyWindow.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? anyWindow.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        : compose

export const history = createHashHistory();
const rootReducer = createRootReducer(history);

const enhancer = composeEnhancers();

export type RootState = ReturnType<typeof rootReducer>;

export const configuredStore = () => {
    // Create Store
    const store = createStore(rootReducer, enhancer);

    if (process.env.NODE_ENV === 'development' && (module as any).hot) {
        (module as any).hot.accept(
            '../reducers',
            // eslint-disable-next-line global-require
            () => store.replaceReducer(require('../reducers').default)
        );
    }
    return store;
};
export type Store = ReturnType<typeof configuredStore>;
