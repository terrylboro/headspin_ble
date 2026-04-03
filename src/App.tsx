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

type Screen = 'setup' | 'treatment';

function TopBar() {
  return (
    <Group justify="space-between" h="100%" px="md">
      <Title order={3}>HeadSpin</Title>
      <Group>
        <Badge color="green">Bluetooth connected</Badge>
        <Badge color="green">Streaming</Badge>
      </Group>
    </Group>
  );
}

function StatusBar() {
  return (
    <Group justify="space-between" h="100%" px="md">
      <Text size="sm">100 Hz</Text>
      <Text size="sm">0 dropped</Text>
      <Text size="sm">Connected</Text>
    </Group>
  );
}

type ReceivedMessage = {
  ts: string;
  raw: string;        // raw bytes as decimal (byte-by-byte)
  text?: string;      // optional UTF-8 attempt (usually nonsense for binary)
  decoded?: string;   // pretty decoded IMU packet (if it matches)
};

function formatIMUPacket(pkt: ReturnType<typeof decodeIMUPacket>): string {
  const lines: string[] = [];
  lines.push(`IMU packet`);
  lines.push(`  seq: ${pkt.seq}`);
  lines.push(`  n: ${pkt.n}`);
  lines.push(`  t0_ms: ${pkt.t0_ms}`);

  pkt.frames.forEach((f, i) => {
    lines.push(
      `  frame[${i}]:\n` +
      `    accel (g):  (${f.ax_g.toFixed(3)}, ${f.ay_g.toFixed(3)}, ${f.az_g.toFixed(3)})\n` +
      `    gyro  (dps):(${f.gx_dps.toFixed(2)}, ${f.gy_dps.toFixed(2)}, ${f.gz_dps.toFixed(2)})`
    );
  });
  return lines.join('\n');
}

function App(): JSX.Element { 
  const { state, context, actions } = useStateMachine();

  const ble = useBleDevice();

  const [screen, setScreen] = useState<Screen>('setup');
  const [selectedCanals, setSelectedCanals] = useState<string[]>([]);

 
  // Mantine theming
  const theme = useMantineTheme();

  return (
      <AppShell
        header={{ height: 60 }}
        footer={{ height: 40 }}
        padding="md"
      >

      <AppShell.Header style={{
          backgroundColor: theme.colors.blue[6],
          color: theme.white,
        }}>
        <TopBar />
      </AppShell.Header>

      

    <AppShell.Main
      style={{
        minHeight: 'calc(100vh - 60px - 44px)', // full height minus header and footer
        display: 'block',
        backgroundColor: theme.colors.gray[0],
        justifyContent: 'center',
        alignItems: 'center',
      }}>

      {screen === 'setup' ? (
        <SetupScreen
          bleStatus={ble.connected ? 'connected' : 'disconnected'}
          deviceName={ble.deviceName}
          bleError={ble.error}
          selectedCanals={selectedCanals}
          setSelectedCanals={setSelectedCanals}
          onConnect={ble.connect}
          onDisconnect={ble.disconnect}
          onContinue={() => setScreen('treatment')}
        />
      ) : (
        <TreatmentScreen
          selectedCanals={selectedCanals}
          progress={0}
          latestSampleText={
            ble.messages.length > 0
              ? `Received ${ble.messages.length} messages`
              : 'Waiting for data'
          }
          onBack={() => setScreen('setup')}
        />
      )}
    </AppShell.Main>

    <AppShell.Footer style={{
          backgroundColor: theme.colors.blue[6],
          color: theme.white,
        }}>
          <StatusBar />
    </AppShell.Footer>

    </AppShell>
    
  );
}

export default App;

// // Add this widget for IMU debugging
// {error && <div style={{ color: 'salmon', marginTop: 8 }}>{error}</div>}

//     <section style={{ textAlign: 'left', width: '80%', maxWidth: 800, marginTop: 20 }}>
//       <h3>Received Messages</h3>
//       <div style={{ maxHeight: 300, overflow: 'auto', background: 'rgba(255,255,255,0.03)', padding: 8 }}>
//         {messages.length === 0 && <div style={{ color: '#bbb' }}>No messages yet.</div>}
//         {messages.map((m, idx) => (
//           <div key={idx} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
//             <div style={{ fontSize: 12, color: '#999' }}>{m.ts}</div>

//             <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#fff' }}>
//               {m.raw}
//             </div>

//             {m.decoded && (
//               <pre style={{ marginTop: 6, fontSize: 12, color: '#ddd', whiteSpace: 'pre-wrap' }}>
//                 {m.decoded}
//               </pre>
//             )}

//             {/* Keeping your old "text" display (usually garbage for binary) */}
//             {m.text && !m.decoded && (
//               <div style={{ fontSize: 13, color: '#ddd' }}>{m.text}</div>
//             )}
//           </div>
//         ))}
//       </div>
//     </section>







// Non-mantine UI
{/* <div style={{height: "1vh"}}/>
    <div style={{display: "flex", flexDirection: "row", width: "100%"}}>

    <div style={{display: "flex", flexDirection: "column", width: "25vw", paddingRight: "1vw"}}>
        <SelectWindow 
            ear={context.affectedEar}
            canal={context.affectedCanal}
            earCallback={handleEarChange}
            canalCallback={handleCanalChange}
            headAlignCallback={updateHeadOffset}
        />

        {context.affectedCanal && 
        <AlignmentDisplay
            stage={context.currentStage}
            stageCallback={handleStageAdvance}
            alignmentRef={alignmentRef}
            alignedRef={alignedRef}
            alignment={context.alignment}
            stage1Progress={context.stage1Progress}
            stage2Progress={context.stage2Progress}
            stage3Progress={context.stage3Progress}
            resetTime={context.resetTime}
            />}
        
        <StateDisplay 
            state={state}
            context={context}
            actions={actions}
        />
        
        
    </div>

    <div style={{display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center", padding: "1vw"}}>
        <CanalRendering 
        canal={context.affectedCanal}
        ear={context.affectedEar}
        affectedCanal={context.affectedCanal}
        matrixRef={matrixRef}
        offsetMatrixRef={matrixOffset}
        stage={context.currentStage}
        alignmentRef={alignmentRef}
        alignedRef={alignedRef}/>
    </div>

    <div style={{display: "flex", flexDirection: "column", width: "25vw", paddingLeft: "1vw"}}>
    
    <HeadRendering
        ear={context.affectedEar}
        matrixRef={matrixRef}
        offsetMatrixRef={matrixOffset}/>
    </div>
    </div>


    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={connect} disabled={connected} style={{ padding: '6px 12px' }}>
        Connect
      </button>
      <button onClick={disconnect} disabled={!connected} style={{ padding: '6px 12px' }}>
        Disconnect
      </button>
      <div style={{ marginLeft: 12 }}>
        <strong>Status:</strong> {connected ? 'Connected' : 'Disconnected'}
        {deviceName ? ` — ${deviceName}` : ''}
      </div>
    </div>

    
    </>
  ); */}