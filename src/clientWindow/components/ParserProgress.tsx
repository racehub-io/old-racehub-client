import React from 'react';
import {
  Progress
} from 'semantic-ui-react';

const ParserProgress = (props) => (
  <>
    <Progress percent={props.progress} active color='blue' progress inverted>
      {props.filepath}
    </Progress>
  </>
);

export default ParserProgress;
