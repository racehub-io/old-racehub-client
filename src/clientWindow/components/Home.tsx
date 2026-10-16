import { ipcRenderer, remote } from 'electron';
import React, { Component } from 'react';
import {
  Container,
  Header,
  Icon,
  Message,
  Segment,
} from 'semantic-ui-react';
import RecordersConfigPage from '../containers/RecordersConfigPage';
import ParsersPage from '../containers/ParsersPage';

const app = remote.app;

class Home extends Component {
  state = {
    updateAvailable: false
  };

  componentDidMount() {
    ipcRenderer.on('UPDATER', (event, arg) => {
      switch (arg) {
        case 'UPDATE_AVAILABLE': {
          this.setState({ updateAvailable: true });
          break;
        }
        default: return;
      }
    })
  }

  render() {
    const { updateAvailable } = this.state;

    return (
      <Container>
        <Segment>
          <Header as="h2" content={`RaceHub Client - ${app.getVersion()}`} />
        </Segment>
        <Message
          hidden={!updateAvailable}
          color="teal"
        >
          <Icon name="cloud download" />
          An update for racehub-client is available. <a className="update" onClick={() => ipcRenderer.send('UPDATER', 'QUIT_AND_UPDATE')}>Click here to update.</a>
        </Message>
        <RecordersConfigPage />
        <ParsersPage />
      </Container>
    )
  }
}

export default Home;
