import { ipcRenderer } from 'electron';
import React from 'react';
import {
  Button,
  Grid,
  Header,
  Icon,
  Menu,
  Segment,
  Tab
} from 'semantic-ui-react';
import ParserProgressPage from '../containers/ParserProgressPage';

const createProgress = parsers => {
  const filteredParsers = Object.values(parsers).filter(parser => parser.progress < 100);
  return filteredParsers.map(parser => {
    const { parserId } = parser;
    return <ParserProgressPage key={parserId} parserId={parserId} />
  })
}

const RecordersConfig = props => (
  <Segment>
    <Header as="h3" content="Parsers" />
    {createProgress(props.parsers)}
    <Grid>
      <Grid.Column width={8} verticalAlign="middle">
        <Button
          icon="code"
          inverted
          color="purple"
          content="Parse recording"
          labelPosition="left"
          onClick={() => {ipcRenderer.send('PARSE_REQUEST')}}
        />
      </Grid.Column>
      <Grid.Column width={8} verticalAlign="middle">
        <Button
          as="a"
          href="https://github.com/racehub-io/old-racehub-client"
          target="_blank"
          icon="linkify"
          inverted
          color="grey"
          content="Project"
          labelPosition="left"
        />
      </Grid.Column>
    </Grid>
  </Segment>
)

export default RecordersConfig;
