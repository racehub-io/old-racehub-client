import React from 'react';
import {
  Header,
  Icon,
  Menu,
  Segment,
  Tab
} from 'semantic-ui-react';
import clientTypes from '../../constants/clientTypes.json';
import F1ConfigPage from '../containers/config/f1ConfigPage';
import RFactor2ConfigPage from '../containers/config/rfactor2ConfigPage';
import RecorderInfoPage from '../containers/RecorderInfoPage';

const createPanes = clients => {
  return Object.values(clients).map(client => {
    const { clientId, clientType, isConnected } = client;
    return {
      menuItem: (
        <Menu.Item key={clientId}>
          <Icon color={isConnected ? "blue" : "grey"} name="circle"/>
          {clientType}
        </Menu.Item>
      ),
      render: () => {
        return (
          <Tab.Pane key={clientId} attached={false}>
            {clientType===clientTypes.F1 ? <F1ConfigPage clientId={clientId} /> : null}
            {clientType===clientTypes.RFACTOR2 ? <RFactor2ConfigPage clientId={clientId} /> : null}
            <RecorderInfoPage clientId={clientId} />
          </Tab.Pane>
        )
      }
    }
  })
}

const RecordersConfig = props => (
  <Segment>
    <Header as="h3" content="Recorders" />
    <Tab
      menu={{ secondary: true, pointing: true }}
      panes={createPanes(props.clients)}
    />
  </Segment>
)

export default RecordersConfig;
