import React from 'react';
import { connect } from 'react-redux';
import RFactor2Config from '../../components/config/RFactor2Config';
import { getClientIsConnected } from '../../selectors/clients';

const mapStateToProps = (state, ownProps) => {
  const { clientId } = ownProps;
  return {
    clientId,
    isConnected: getClientIsConnected(state, clientId)
  }
}

export default connect(mapStateToProps)(RFactor2Config);
