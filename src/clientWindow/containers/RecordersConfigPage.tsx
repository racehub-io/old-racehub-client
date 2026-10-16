import React from 'react';
import { connect } from 'react-redux';
import RecordersConfig from '../components/RecordersConfig';
import { getClients } from '../selectors/clients';

const mapStateToProps = (state) => ({
  clients: getClients(state)
})

export default connect(mapStateToProps)(RecordersConfig);
