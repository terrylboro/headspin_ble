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

// Mantine UI imports
import '@mantine/core/styles.css';
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

function TopBar() {
  return (
    <Group justify="space-between" h="100%" px="md">
      <Title order={3}>HEADSPIN</Title>
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

  const handleCanalChange = (newCanal: "posterior"|"anterior"|"lateral"|"unselected") => {
      actions.selectCanal(context.affectedEar, newCanal);
  }

  const handleEarChange = (newEar: "left"|"right"|"unselected") => {
      actions.updateEar(newEar);
  }

  const handleStageAdvance = (advance: boolean) => {
      if (advance) {
          actions.advanceStage();
      } else {
          actions.returnToStage1();
      }
  }

  const alignmentRef = useRef(0) // alignment score variable, changed by the CanalRendering component 
                                  // using the alignment.ts function, and displayed by the 
                                  // AlignmentDisplay component
  const alignedRef = useRef(false) // boolean for whether or not the alignment is good enough,
                                    // changed by AlignmentDisplay

  const matrixRef =  useRef<Matrix4>(new Matrix4()) // 4x4 (homogeneous coords) rotation matrix
                      //  calculated in CameraWindow then used in each CanalRendering

  const matrixOffset = useRef<Matrix4>(new Matrix4()) // this is used to align head yaw via a button

  const updateHeadOffset = () => {
      matrixOffset.current.copy(matrixRef.current)
      console.log(matrixOffset.current)
  }

  // Bluetooth
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const [serviceUUID, setServiceUUID] = useState("12345678-1234-5678-1234-56789abcdef0");
  const [charUUID, setCharUUID] = useState("12345678-1234-5678-1234-56789abcdef2");

  const [messages, setMessages] = useState<ReceivedMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);


    // Update state machine when alignment changes
  useEffect(() => {
      actions.updateAlignment(alignmentRef.current);
  }, [alignmentRef.current, actions]);


  // Open filter
  const mFilter = new MadgwickFilter(1/256, 0.1); // dt=1/256s, beta=0.1 (tune as needed for responsiveness vs noise)
  // BTEC init
  mFilter.init(0, 0, 9.81)

  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function appendMessage(rawView: DataView) {
    // IMPORTANT: treat notification payload as bytes (Uint8), not Uint16.
    const bytes = new Uint8Array(rawView.buffer, rawView.byteOffset, rawView.byteLength);

    // Display as Base-10 byte values
    const decimal = Array.from(bytes).map(b => b.toString(10)).join(' ');

    // Optional: try interpret as text (usually not meaningful for binary IMU)
    let text: string | undefined;
    try {
      text = new TextDecoder().decode(bytes);
    } catch {
      text = undefined;
    }

    // Try decode IMU packet
    let decoded: string | undefined;
    let dataArr: number[] | undefined
    try {
      const pkt = decodeIMUPacket(rawView); // DataView is perfect here
      decoded = formatIMUPacket(pkt);

      // Extract new data an dupdate filter
      const dataArr = decodeNumericIMUPacket(rawView);
      console.log(dataArr)
      const filtPos = mFilter.update(dataArr[0]*9.81, dataArr[1]*9.81, dataArr[2]*9.81, dataArr[3], dataArr[4], dataArr[5], 0.01); // dt=0.01s (100Hz), adjust as needed
      
      const [w,x,y,z] = [filtPos.qw, filtPos.qx, filtPos.qy, filtPos.qz] as [number, number, number, number];
          
      const quat = new Quaternion(x, y, z, w);  // this worked with MATLAB-calculated quaternion
      const mat = new Matrix4().makeRotationFromQuaternion(quat);

      matrixRef.current.copy(mat);


    } catch (e) {
      // Only surface non-IMU errors if you want; otherwise silently ignore
      if (e instanceof IMUDecodeError) {
        // Not an IMU packet / partial packet / wrong SOF: ignore
      } else {
        decoded = `Decode error: ${String(e)}`;
      }
    }

    const msg: ReceivedMessage = {
      ts: new Date().toLocaleTimeString(),
      raw: decimal,
      text,
      decoded,
    };

    setMessages(prev => [msg, ...prev].slice(0, 200));
  }

  function onCharacteristicValueChanged(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (target?.value) {
      appendMessage(target.value as DataView);
    }
  }

  async function connect() {
    setError(null);
    if (!navigator.bluetooth) {
      setError('Web Bluetooth API not available in this browser. Use Chrome or Edge.');
      return;
    }

    try {
      let options: RequestDeviceOptions;
      if (serviceUUID.trim()) {
        options = {
          filters: [{ services: [serviceUUID.trim()] }],
          optionalServices: [serviceUUID.trim()]
        };
      } else {
        options = {
          acceptAllDevices: true,
          optionalServices: charUUID.trim() ? [charUUID.trim()] : undefined
        };
      }

      const device = await navigator.bluetooth.requestDevice(options);
      deviceRef.current = device;
      setDeviceName(device.name || device.id || 'Unknown');

      device.addEventListener('gattserverdisconnected', () => {
        setConnected(false);
      });

      const server = await device.gatt!.connect();
      let service: BluetoothRemoteGATTService;

      if (serviceUUID.trim()) {
        service = await server.getPrimaryService(serviceUUID.trim());
      } else if (charUUID.trim()) {
        service = await server.getPrimaryService(charUUID.trim());
      } else {
        setError('Please provide a service UUID or characteristic UUID.');
        return;
      }

      if (!charUUID.trim()) {
        const chars = await service.getCharacteristics();
        const notifyChar = chars.find((c: BluetoothRemoteGATTCharacteristic) =>
          c.properties.notify || c.properties.indicate || c.properties.read
        );
        if (!notifyChar) {
          setError('No suitable characteristic found (notify/indicate/read).');
          return;
        }
        characteristicRef.current = notifyChar;
      } else {
        characteristicRef.current = await service.getCharacteristic(charUUID.trim());
      }

      const char = characteristicRef.current!;
      if (char.properties.notify || char.properties.indicate) {
        await char.startNotifications();
        char.addEventListener('characteristicvaluechanged', onCharacteristicValueChanged as EventListener);
      } else if (char.properties.read) {
        const value = await char.readValue();
        appendMessage(value);
      }

      setConnected(true);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function disconnect() {
    try {
      if (characteristicRef.current) {
        try {
          await characteristicRef.current.stopNotifications();
        } catch {
          // ignore
        }
        characteristicRef.current.removeEventListener('characteristicvaluechanged', onCharacteristicValueChanged as EventListener);
        characteristicRef.current = null;
      }
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
      deviceRef.current = null;
      setConnected(false);
      setDeviceName(null);
    } catch {
      // ignore
    }
  }

  // Mantine theming
  const theme = useMantineTheme();

  return (

    <MantineProvider defaultColorScheme="light">
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm' }}
        aside={{ width: 320, breakpoint: 'md' }}
        footer={{ height: 40 }}
        padding="md"
      >

      <AppShell.Header style={{
          backgroundColor: theme.colors.blue[6],
          color: theme.white,
        }}>
        <TopBar />
      </AppShell.Header>

      <div style={{height: "1vh"}}/>
      <div style={{display: "flex", flexDirection: "row", width: "100%"}}>

      <div style={{display: "flex", flexDirection: "column", width: "25vw", paddingRight: "1vw", paddingTop: "10vh"}}>
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

    <AppShell.Footer style={{
          backgroundColor: theme.colors.blue[6],
          color: theme.white,
        }}>
          <StatusBar />
    </AppShell.Footer>

    </AppShell>
  </MantineProvider>
    
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