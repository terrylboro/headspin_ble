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

const POWER_DOWN_BYTE = 0xf0;
const POWER_DOWN_TEXT = '0xF0';

function isPowerDownNotification(value: DataView): boolean {
  const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);

  if (bytes.some((byte) => byte === POWER_DOWN_BYTE)) {
    return true;
  }

  const text = new TextDecoder().decode(bytes).trim();
  return text.toUpperCase().includes(POWER_DOWN_TEXT.toUpperCase());
}




function App(): JSX.Element { 

  const ble = useBleDevice();
  const treatment = useTreatment();

  const [screen, setScreen] = useState<Screen>('setup');
  const [selectedCanals, setSelectedCanals] = useState<string[]>([]);

  const testMode = false; // Set to true to enable test mode (bypasses setup and calibration)
  // To control calibration popup
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [powerDownNotificationOpen, setPowerDownNotificationOpen] = useState(false);

  useEffect(() => {
    const message = ble.latestButtonMessage;

    if (message && isPowerDownNotification(message.data)) {
      setPowerDownNotificationOpen(true);
    }
  }, [ble.latestButtonMessage]);

 
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

  async function handleReconnect() {
    const connected = await ble.connect();

    if (connected) {
      setPowerDownNotificationOpen(false);
    }
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
          showTimerSlider={screen === 'calibrate' || screen === 'treatment'}
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

      <Modal
        opened={powerDownNotificationOpen}
        onClose={() => setPowerDownNotificationOpen(false)}
        title="Device powering down"
        centered
      >
        <p>
          The Bluetooth device is powering down. Turn it back on, then reconnect to
          continue without losing the current treatment selections or progress.
        </p>
        <Button
          fullWidth
          loading={ble.connecting}
          disabled={ble.connected}
          onClick={handleReconnect}
        >
          {ble.connected ? 'Waiting for device to power down' : 'Reconnect device'}
        </Button>
        {ble.error && (
          <p style={{ color: 'var(--mantine-color-red-7)' }} role="alert">
            {ble.error}
          </p>
        )}
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
          batteryLevel={ble.batteryLevel}
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
