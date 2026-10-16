import React from 'react';
import { connect } from 'react-redux';
import RecorderInfo from '../components/RecorderInfo';
import { getClientLastMessage, getClientMessageCount } from '../selectors/clients';

const mapStateToProps = (state, ownProps) => {
  const { clientId } = ownProps;
  return {
    lastMessage: getClientLastMessage(state, clientId),
    messageCount: getClientMessageCount(state, clientId)
  }
}


export default connect(mapStateToProps)(RecorderInfo);
