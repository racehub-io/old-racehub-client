import React from 'react';
import { connect } from 'react-redux';
import ParserProgress from '../components/ParserProgress';
import { getParserFilepath, getParserProgress } from '../selectors/parsers';

const mapStateToProps = (state, ownProps) => {
  const { parserId } = ownProps;
  return {
    filepath: getParserFilepath(state, parserId),
    progress: getParserProgress(state, parserId)
  }
};

export default connect(mapStateToProps)(ParserProgress);
