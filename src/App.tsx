import { useRef, useState } from 'react';
import { useEffect } from 'react';
import './App.css';

import { Matrix4, Quaternion } from 'three';
import SelectWindow from './components/SelectWindow';
import AlignmentDisplay from './components/AlignmentDisplay';
import StateDisplay from './components/StateDisplay';
import HeadRendering from './components/HeadRendering';
import CanalRendering from './components/CanalRendering';

import { useStateMachine } from './hooks/useStateMachine';

import { decodeIMUPacket, IMUDecodeError, decodeNumericIMUPacket } from './utils/imuDecoder';

import { MadgwickFilter } from './utils/madgwickFilter';

import SetupScreen from './components/SetupScreen';
import TreatmentScreen from './components/TreatmentScreen';
import { useBleDevice } from './context/BleProvider';

import TopBar from './components/TopBar';

import ManualHeadRendering from './test/ManualHeadRendering';

// Mantine UI imports
import {
  AppShell,
  Badge,
  Box,
  Button,
  Card,
  Group,
  MantineProvider,
  Progress,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import StateMachineTestPanel from './test/StateMachineTestPanel';

type Screen = 'setup' | 'treatment';

function StatusBar() {
  return (
    <Group justify="space-between" h="100%" px="md">
      {/* <Text size="sm">100 Hz</Text>
      <Text size="sm">0 dropped</Text>
      <Text size="sm">Connected</Text> */}
    </Group>
  );
}


function App(): JSX.Element { 

  const ble = useBleDevice();

  const [screen, setScreen] = useState<Screen>('setup');
  const [selectedCanals, setSelectedCanals] = useState<string[]>([]);

  const testMode = false;

 
  // Mantine theming
  const theme = useMantineTheme();

  return (
      <AppShell
        header={{ height: 60 }}
        // footer={{ height: 40 }}
        padding="md"
        style={{height: '100vh', overflow: 'hidden'}}
      >

      <AppShell.Header style={{
          backgroundColor: theme.colors.blue[6],
          color: theme.white,
        }}>
        <TopBar setScreen={setScreen} />
      </AppShell.Header>

      

    <AppShell.Main
      style={{
        minHeight: 'calc(100vh - 60px)', // full height minus header
        overflow: 'hidden',
        display: 'block',
        backgroundColor: theme.colors.gray[0],
        justifyContent: 'center',
        alignItems: 'center',
      }}>

      {
      testMode ? (
          StateMachineTestPanel()
        
      ) : screen === 'setup' ? (
        <SetupScreen
          bleStatus={ble.connected ? 'connected' : 'disconnected'}
          deviceName={ble.deviceName}
          bleError={ble.error}
          onConnect={ble.connect}
          onDisconnect={ble.disconnect}
          onContinue={() => setScreen('treatment')}
        />
      ) : (
        <TreatmentScreen
          onBack={() => setScreen('setup')}
        />
      )}
    </AppShell.Main>

    {/* <AppShell.Footer style={{
          backgroundColor: theme.colors.blue[6],
          color: theme.white,
        }}>
          <StatusBar />
    </AppShell.Footer> */}

    </AppShell>
    
  );
}

export default App;
