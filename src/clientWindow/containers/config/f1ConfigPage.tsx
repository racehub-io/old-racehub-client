import React from 'react';
import { connect } from 'react-redux';
import F1Config from '../../components/config/F1Config';
import { getClientIsConnected } from '../../selectors/clients';

const mapStateToProps = (state, ownProps) => {
  const { clientId } = ownProps;
  return {
    clientId,
    isConnected: getClientIsConnected(state, clientId)
  }
}

export default connect(mapStateToProps)(F1Config);
