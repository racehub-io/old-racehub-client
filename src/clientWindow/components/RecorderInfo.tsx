import React from 'react';
import Moment from 'react-moment';
import {
  Header,
  Segment,
  Statistic
} from 'semantic-ui-react';
import millify from 'millify';

const RecorderInfo = (props) => (
  <>
    <Header as="h3" content="Recorder Information" />
    <Statistic.Group size="mini">
      <Statistic>
        <Statistic.Value>
          {props.lastMessage ? <Moment format="HH:mm:ss.SSS">{props.lastMessage}</Moment> : '--'}
        </Statistic.Value>
        <Statistic.Label>Last packet</Statistic.Label>
      </Statistic>
      <Statistic>
        <Statistic.Value>
          {props.messageCount ? millify(props.messageCount, {precision: 1}) : '--'}
        </Statistic.Value>
        <Statistic.Label>Packets recieved</Statistic.Label>
      </Statistic>
    </Statistic.Group>
  </>
);

export default RecorderInfo;
