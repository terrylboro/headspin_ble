import { useRef, useState } from 'react';
import { useEffect } from 'react';
import './App.css';

import SetupScreen from './components/SetupScreen';
import TreatmentScreen from './components/TreatmentScreen';
import { useBleDevice } from './context/BleProvider';
import { useTreatment } from './context/TreatmentProvider';

import TopBar from './components/TopBar';

import ManualHeadRendering from './test/ManualHeadRendering';
import ResearchScreenTestPanel from './test/ResearchScreenTestPanel';

// Mantine UI imports
import {
  AppShell,
  Button,
  Modal,
  useMantineTheme,
} from '@mantine/core';

import StateMachineTestPanel from './test/StateMachineTestPanel';
import CalibrationScreen from './components/CalibrationScreen';
import ResearchScreen from './components/ResearchScreen';
import GyroscopeCalibrationScreen from './components/GyroscopeCalibrationScreen';
import { truncate } from 'node:fs';
import HeadCanalAlignmentTestPanel from './test/HeadCanalAlignmentTestPanel';

type Screen = 'setup' | 'gyroscope-calibration' | 'calibrate' | 'treatment' | 'research';




function App(): JSX.Element { 

  const ble = useBleDevice();
  const treatment = useTreatment();

  const [screen, setScreen] = useState<Screen>('setup');
  const [selectedCanals, setSelectedCanals] = useState<string[]>([]);

  const testMode = false; // Set to true to enable test mode (bypasses setup and calibration)
  // To control calibration popup
  const [calibrationOpen, setCalibrationOpen] = useState(false);

 
  // Mantine theming
  const theme = useMantineTheme();

  async function handleSystemReset() {
    setCalibrationOpen(false);
    setSelectedCanals([]);
    await ble.disconnect();
    treatment.resetTreatment();
    treatment.clearGyroscopeOffsets();
    setScreen('setup');
  }

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
        <TopBar
          setScreen={setScreen}
          setCalibrationOpen={setCalibrationOpen}
          onReset={handleSystemReset}
        />

      </AppShell.Header>

      <Modal
        opened={calibrationOpen}
        onClose={() => setCalibrationOpen(false)}
        title="Gyroscope calibration"
        centered
      >
        <GyroscopeCalibrationScreen onComplete={() => setCalibrationOpen(false)} />
    </Modal>
      

    <AppShell.Main
      style={{
        minHeight: 'calc(100vh - 60px)', // full height minus header
        // maxHeight: '60vh',
        overflow: 'hidden',
        display: 'block',
        backgroundColor: theme.colors.gray[0],
        justifyContent: 'center',
        alignItems: 'center',
      }}>

      {
      testMode ? (
          // <ResearchScreenTestPanel
          //   bleStatus={ble.connected ? 'connected' : 'disconnected'}
          //   deviceName={ble.deviceName}
          //   bleError={ble.error}
          //   onConnect={ble.connect}
          //   onDisconnect={ble.disconnect}
          // />
          <HeadCanalAlignmentTestPanel />
        
      ) : screen === 'setup' ? (
        <SetupScreen
          bleStatus={ble.connected ? 'connected' : 'disconnected'}
          deviceName={ble.deviceName}
          bleError={ble.error}
          onConnect={ble.connect}
          onDisconnect={ble.disconnect}
          onContinue={() => setScreen('gyroscope-calibration')}
        />
      ) : screen === 'gyroscope-calibration' ? (
        <GyroscopeCalibrationScreen
          onComplete={() => setScreen('calibrate')}
        />
      ) : screen === 'research' ? (
        <ResearchScreen
          onBack={() => setScreen('calibrate')}
        />
      ) :
      
      screen === 'treatment' ? (
        <TreatmentScreen
          onBack={() => setScreen('calibrate')}
        />
      ) : (
          <CalibrationScreen
            onBack={() => setScreen('gyroscope-calibration')}
            onContinue={() => setScreen('treatment')}
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
