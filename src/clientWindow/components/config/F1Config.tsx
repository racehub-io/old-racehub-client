import React, { Component } from 'react';
import {
  Button,
  Form
} from 'semantic-ui-react';
import userSettings from '../../../userSettings';
import clients from '../../api/index';

class F1Config extends Component {
  state = {
    inPort: userSettings.get('recorders_F1_inport'),
    outPort: userSettings.get('recorders_F1_outport'),
    submittedInPort: userSettings.get('recorders_F1_inport'),
    submittedOutPort: userSettings.get('recorders_F1_outport')
  }

  changeInPort = (e, { value }) => this.setState({ inPort: parseInt(value) })
  changeOutPort = (e, { value }) => this.setState({ outPort: parseInt(value) })

  handleSubmit = () => {
    const { clientId } = this.props;
    const { inPort, outPort } = this.state;
    const client = clients[clientId];

    // if passes checks
    this.setState({ submittedInPort: inPort, submittedOutPort: outPort });
    userSettings.set('recorders_F1_inport', parseInt(inPort));
    userSettings.set('recorders_F1_outport', parseInt(outPort));
    client.connect();
  }

  checkInPortValid() {
    const { inPort } = this.state;
    const valid = (inPort > 0 && inPort < 65535) ? true: false;
    return valid;
  }

  checkOutPortValid() {
    const { outPort } = this.state;
    const valid = (outPort > 0 && outPort < 65535) ? true: false;
    return valid;
  }

  render() {
    const { clientId, isConnected } = this.props;
    const { submittedInPort, submittedOutPort } = this.state;
    const client = clients[clientId];

    const inPortValid = this.checkInPortValid();
    const outPortValid = this.checkOutPortValid();

    return (
      <Form inverted key={clientId} onSubmit={this.handleSubmit}>
        <Form.Group widths="equal" inline>
          <Form.Input
            disabled={isConnected}
            error={!inPortValid}
            fluid
            required
            name="inport"
            icon="terminal"
            label="UDP In Port"
            defaultValue={submittedInPort}
            onChange={this.changeInPort}
          />
          <Form.Input
            disabled={isConnected}
            error={!outPortValid}
            fluid
            required
            name="outport"
            icon="terminal"
            label="UDP Out Port"
            defaultValue={submittedOutPort}
            onChange={this.changeOutPort}
          />
        </Form.Group>
        <Form.Group widths="equal" inline>
          <Button
            type='submit'
            disabled={!inPortValid || !outPortValid || isConnected}
            icon="linkify"
            inverted
            color="blue"
            content="Connect"
            labelPosition="left"
          />
          <Button
            disabled={!isConnected}
            icon="unlink"
            inverted
            color="grey"
            content="Disconnect"
            labelPosition="left"
            onClick={() => {client.disconnect()}}
          />
        </Form.Group>
      </Form>
    )
  }
};

export default F1Config;
