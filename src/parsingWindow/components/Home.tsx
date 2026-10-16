import { ipcRenderer } from 'electron';
import React, { Component } from 'react';
import {
  Container,
  Header,
  Segment,
} from 'semantic-ui-react';
import { F1ParquetParser } from '../api/index';

class Home extends Component {
  componentDidMount() {
    ipcRenderer.on('PARSE_FILEPATH', (_, parserId, filepath) => {
      const parquetparser = new F1ParquetParser(parserId, filepath);
      parquetparser.participantPerFile();
    });
  }

  render() {
    return (
      <Container>
        <Segment>
          <Header as="h2" content="RHC Sesison Parser" />
        </Segment>
      </Container>
    )
  }
}

export default Home;
