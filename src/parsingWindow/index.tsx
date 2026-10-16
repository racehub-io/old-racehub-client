import React from 'react';
import { render } from 'react-dom';
import { history } from './store/configureStore';
import { store } from './store/store';
import Root from './Root';

render(
  <Root store={store} history={history} />,
  document.getElementById('root')
);
