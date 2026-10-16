import React from 'react';
import { connect } from 'react-redux';
import Parsers from '../components/Parsers';
import { getParsers } from '../selectors/parsers';

const mapStateToProps = (state) => ({
  parsers: getParsers(state)
})

export default connect(mapStateToProps)(Parsers);
