/// <reference path="./types/web-bluetooth.d.ts" />
import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';

import { decodeIMUPacket, IMUDecodeError } from './utils/imuDecoder';

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
  // pkt.frames.forEach((f, i) => {
  //   lines.push(
  //     `  frame[${i}]: ` +
  //     `a=(${f.ax}, ${f.ay}, ${f.az}) ` +
  //     `g=(${f.gx}, ${f.gy}, ${f.gz})`
  //   );
  // });
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
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // BLEService        svc ("12345678-1234-5678-1234-56789abcdef0");
  // BLECharacteristic chIMU("12345678-1234-5678-1234-56789abcdef2");
  const [serviceUUID, setServiceUUID] = useState("12345678-1234-5678-1234-56789abcdef0");
  const [charUUID, setCharUUID] = useState("12345678-1234-5678-1234-56789abcdef2");

  const [messages, setMessages] = useState<ReceivedMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

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
    try {
      const pkt = decodeIMUPacket(rawView); // DataView is perfect here
      decoded = formatIMUPacket(pkt);
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

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h2>Web Bluetooth Receiver</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            placeholder="Service UUID (optional)"
            value={serviceUUID}
            onChange={e => setServiceUUID(e.target.value)}
            style={{ width: 420 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            placeholder="Characteristic UUID (optional)"
            value={charUUID}
            onChange={e => setCharUUID(e.target.value)}
            style={{ width: 420 }}
          />
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

        {error && <div style={{ color: 'salmon', marginTop: 8 }}>{error}</div>}

        <section style={{ textAlign: 'left', width: '80%', maxWidth: 800, marginTop: 20 }}>
          <h3>Received Messages</h3>
          <div style={{ maxHeight: 300, overflow: 'auto', background: 'rgba(255,255,255,0.03)', padding: 8 }}>
            {messages.length === 0 && <div style={{ color: '#bbb' }}>No messages yet.</div>}
            {messages.map((m, idx) => (
              <div key={idx} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: 12, color: '#999' }}>{m.ts}</div>

                <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#fff' }}>
                  {m.raw}
                </div>

                {m.decoded && (
                  <pre style={{ marginTop: 6, fontSize: 12, color: '#ddd', whiteSpace: 'pre-wrap' }}>
                    {m.decoded}
                  </pre>
                )}

                {/* Keeping your old "text" display (usually garbage for binary) */}
                {m.text && !m.decoded && (
                  <div style={{ fontSize: 13, color: '#ddd' }}>{m.text}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </header>
    </div>
  );
}

export default App;



// /// <reference path="./types/web-bluetooth.d.ts" />
// import React, { useEffect, useRef, useState } from 'react';
// import logo from './logo.svg';
// import './App.css';

// type ReceivedMessage = {
//   ts: string;
//   raw: string;
//   text?: string;
// };

// function App(): JSX.Element {
//   const [deviceName, setDeviceName] = useState<string | null>(null);
//   const [connected, setConnected] = useState(false);
//   // These are the Bluetooth credentials for the ESP32:
//   // BLEService        svc ("12345678-1234-5678-1234-56789abcdef0");
//   // BLECharacteristic chIMU("12345678-1234-5678-1234-56789abcdef2");
//   const [serviceUUID, setServiceUUID] = useState("12345678-1234-5678-1234-56789abcdef0");
//   const [charUUID, setCharUUID] = useState("12345678-1234-5678-1234-56789abcdef2");
//   const [messages, setMessages] = useState<ReceivedMessage[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   const deviceRef = useRef<BluetoothDevice | null>(null);
//   const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

//   useEffect(() => {
//     return () => {
//       // cleanup on unmount
//       disconnect();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   function appendMessage(rawBuf: DataView) {
//     const bytes = new Uint16Array(rawBuf.buffer);
//     // Display as Base 10 (decimal) values
//     const decimal = Array.from(bytes)
//       .map(b => b.toString(10))
//       .join(' ');
//     let text: string | undefined;
//     try {
//       text = new TextDecoder().decode(bytes);
//     } catch (e) {
//       text = undefined;
//     }
//     const msg: ReceivedMessage = { ts: new Date().toLocaleTimeString(), raw: decimal, text };
//     setMessages(prev => [msg, ...prev].slice(0, 200));
//   }

//   function onCharacteristicValueChanged(event: Event) {
//     // Use direct type assertion for target
//     const target = event.target as BluetoothRemoteGATTCharacteristic;
//     if (target && target.value) {
//       const value = target.value as DataView;
//       appendMessage(value);
//     }
//   }

//   async function connect() {
//     setError(null);
//     if (!navigator.bluetooth) {
//       setError('Web Bluetooth API not available in this browser. Use Chrome or Edge.');
//       return;
//     }

//     try {
//       // Use correct type for RequestDeviceOptions
//       let options: RequestDeviceOptions;
//       if (serviceUUID.trim()) {
//         options = {
//           filters: [{ services: [serviceUUID.trim()] }],
//           optionalServices: [serviceUUID.trim()]
//         };
//       } else {
//         options = {
//           acceptAllDevices: true,
//           optionalServices: charUUID.trim() ? [charUUID.trim()] : undefined
//         };
//       }

//       const device = await navigator.bluetooth.requestDevice(options);
//       deviceRef.current = device;
//       setDeviceName(device.name || device.id || 'Unknown');

//       device.addEventListener('gattserverdisconnected', () => {
//         setConnected(false);
//       });

//       const server = await device.gatt!.connect();
//       let service: BluetoothRemoteGATTService;
//       if (serviceUUID.trim()) {
//         service = await server.getPrimaryService(serviceUUID.trim());
//       } else if (charUUID.trim()) {
//         // If only a characteristic UUID was provided, try to get its primary service
//         service = await server.getPrimaryService(charUUID.trim());
//       } else {
//         setError('Please provide a service UUID or characteristic UUID.');
//         return;
//       }

//       if (!charUUID.trim()) {
//         // pick first characteristic that supports notify or indicate
//         const chars = await service.getCharacteristics();
//         const notifyChar = chars.find((c: BluetoothRemoteGATTCharacteristic) =>
//           c.properties.notify || c.properties.indicate || c.properties.read
//         );
//         if (!notifyChar) {
//           setError('No suitable characteristic found (notify/indicate/read).');
//           return;
//         }
//         characteristicRef.current = notifyChar;
//       } else {
//         characteristicRef.current = await service.getCharacteristic(charUUID.trim());
//       }

//       const char = characteristicRef.current!;
//       if (char.properties.notify || char.properties.indicate) {
//         await char.startNotifications();
//         char.addEventListener('characteristicvaluechanged', onCharacteristicValueChanged as EventListener);
//       } else if (char.properties.read) {
//         // read once
//         const value = await char.readValue();
//         appendMessage(value);
//       }

//       setConnected(true);
//     } catch (e: any) {
//       setError(e?.message || String(e));
//     }
//   }

//   async function disconnect() {
//     try {
//       if (characteristicRef.current) {
//         try {
//           await characteristicRef.current.stopNotifications();
//         } catch (e) {
//           // ignore
//         }
//         characteristicRef.current.removeEventListener('characteristicvaluechanged', onCharacteristicValueChanged as EventListener);
//         characteristicRef.current = null;
//       }
//       if (deviceRef.current && deviceRef.current.gatt && deviceRef.current.gatt.connected) {
//         deviceRef.current.gatt.disconnect();
//       }
//       deviceRef.current = null;
//       setConnected(false);
//       setDeviceName(null);
//     } catch (e) {
//       // ignore
//     }
//   }

//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <h2>Web Bluetooth Receiver</h2>

//         <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
//           <input
//             placeholder="Service UUID (optional) e.g. 0000180f-0000-1000-8000-00805f9b34fb or 0x180F"
//             value={serviceUUID}
//             onChange={e => setServiceUUID(e.target.value)}
//             style={{ width: 420 }}
//           />
//         </div>

//         <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
//           <input
//             placeholder="Characteristic UUID (optional) e.g. 2A19 or 00002a19-0000-1000-8000-00805f9b34fb"
//             value={charUUID}
//             onChange={e => setCharUUID(e.target.value)}
//             style={{ width: 420 }}
//           />
//         </div>

//         <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//           <button onClick={connect} disabled={connected} style={{ padding: '6px 12px' }}>
//             Connect
//           </button>
//           <button onClick={disconnect} disabled={!connected} style={{ padding: '6px 12px' }}>
//             Disconnect
//           </button>
//           <div style={{ marginLeft: 12 }}>
//             <strong>Status:</strong> {connected ? 'Connected' : 'Disconnected'}
//             {deviceName ? ` — ${deviceName}` : ''}
//           </div>
//         </div>

//         {error && (
//           <div style={{ color: 'salmon', marginTop: 8 }}>{error}</div>
//         )}

//         <section style={{ textAlign: 'left', width: '80%', maxWidth: 800, marginTop: 20 }}>
//           <h3>Received Messages</h3>
//           <div style={{ maxHeight: 300, overflow: 'auto', background: 'rgba(255,255,255,0.03)', padding: 8 }}>
//             {messages.length === 0 && <div style={{ color: '#bbb' }}>No messages yet.</div>}
//             {messages.map((m, idx) => (
//               <div key={idx} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
//                 <div style={{ fontSize: 12, color: '#999' }}>{m.ts}</div>
//                 <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#fff' }}>{m.raw}</div>
//                 {m.text && <div style={{ fontSize: 13, color: '#ddd' }}>{m.text}</div>}
//               </div>
//             ))}
//           </div>
//         </section>

//       </header>
//     </div>
//   );
// }

// export default App;
