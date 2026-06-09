import { useCallback, useEffect, useRef, useState } from 'react';

export type ReceivedMessage = {
  timestamp: number;
  data: DataView;
};

type UseBleDeviceOptions = {
  initialServiceUUID?: string;
  initialCharUUID?: string;
};

export function useBleDeviceInternal(options?: UseBleDeviceOptions) {
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [serviceUUID, setServiceUUID] = useState(
    options?.initialServiceUUID ?? '12345678-1234-5678-1234-56789abcdef0'
  );
  const [charUUID, setCharUUID] = useState(
    options?.initialCharUUID ?? '12345678-1234-5678-1234-56789abcdef2'
  );

  const [messages, setMessages] = useState<ReceivedMessage[]>([]);
  const [latestMessage, setLatestMessage] = useState<ReceivedMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const disconnectHandlerRef = useRef<((event: Event) => void) | null>(null);

  const appendMessage = useCallback((value: DataView) => {

    const msg = {
    timestamp: Date.now(),
    data: value,
    };

    setLatestMessage(msg);

    setMessages((prev) => {
      const next = [...prev, msg];
      return next.length > 200 ? next.slice(next.length - 200) : next;
    });
  }, []);

  const onCharacteristicValueChanged = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (target?.value) {
      appendMessage(target.value);
    }
  }, [appendMessage]);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);

    if (!navigator.bluetooth) {
      setError('Web Bluetooth API not available in this browser. Use Chrome or Edge.');
      setConnecting(false);
      return false;
    }

    try {
      const trimmedServiceUUID = serviceUUID.trim();
      const trimmedCharUUID = charUUID.trim();

      let options: RequestDeviceOptions;

      if (trimmedServiceUUID) {
        options = {
          filters: [{ services: [trimmedServiceUUID] }],
          optionalServices: [trimmedServiceUUID],
        };
      } else {
        options = {
          acceptAllDevices: true,
          optionalServices: trimmedCharUUID ? [trimmedCharUUID] : undefined,
        };
      }

      const device = await navigator.bluetooth.requestDevice(options);
      deviceRef.current = device;
      setDeviceName(device.name || device.id || 'Unknown');

      const handleDisconnected = () => {
        setConnected(false);
      };

      disconnectHandlerRef.current = handleDisconnected;
      device.addEventListener('gattserverdisconnected', handleDisconnected);

      const server = await device.gatt!.connect();
      let service: BluetoothRemoteGATTService;

      if (trimmedServiceUUID) {
        service = await server.getPrimaryService(trimmedServiceUUID);
      } else if (trimmedCharUUID) {
        service = await server.getPrimaryService(trimmedCharUUID);
      } else {
        setError('Please provide a service UUID or characteristic UUID.');
        return false;
      }

      let chosenCharacteristic: BluetoothRemoteGATTCharacteristic;

      if (!trimmedCharUUID) {
        const chars = await service.getCharacteristics();
        const notifyChar = chars.find(
          (c) => c.properties.notify || c.properties.indicate || c.properties.read
        );

        if (!notifyChar) {
          setError('No suitable characteristic found (notify/indicate/read).');
          return false;
        }

        chosenCharacteristic = notifyChar;
      } else {
        chosenCharacteristic = await service.getCharacteristic(trimmedCharUUID);
      }

      characteristicRef.current = chosenCharacteristic;

      if (chosenCharacteristic.properties.notify || chosenCharacteristic.properties.indicate) {
        chosenCharacteristic.addEventListener(
          'characteristicvaluechanged',
          onCharacteristicValueChanged as EventListener
        );
        await chosenCharacteristic.startNotifications();
      } else if (chosenCharacteristic.properties.read) {
        const value = await chosenCharacteristic.readValue();
        appendMessage(value);
      }

      setConnected(true);
      return true;
    } catch (e: any) {
      setError(e?.message || String(e));
      setConnected(false);
      return false;
    } finally {
      setConnecting(false);
    }
  }, [serviceUUID, charUUID, onCharacteristicValueChanged, appendMessage]);

  const disconnect = useCallback(async () => {
    try {
      if (characteristicRef.current) {
        try {
          await characteristicRef.current.stopNotifications();
        } catch {
          // ignore
        }

        characteristicRef.current.removeEventListener(
          'characteristicvaluechanged',
          onCharacteristicValueChanged as EventListener
        );
        characteristicRef.current = null;
      }

      if (deviceRef.current && disconnectHandlerRef.current) {
        deviceRef.current.removeEventListener(
          'gattserverdisconnected',
          disconnectHandlerRef.current
        );
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
  }, [onCharacteristicValueChanged]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    return () => {
      void disconnect();
    };
  }, [disconnect]);

  return {
    deviceName,
    connected,
    connecting,
    serviceUUID,
    setServiceUUID,
    charUUID,
    setCharUUID,
    messages,
    latestMessage,
    error,
    connect,
    disconnect,
    clearMessages,
  };
}

// Working Bluetooth code from App.tsx
// // Bluetooth
//   const [deviceName, setDeviceName] = useState<string | null>(null);
//   const [connected, setConnected] = useState(false);

//   const [serviceUUID, setServiceUUID] = useState("12345678-1234-5678-1234-56789abcdef0");
//   const [charUUID, setCharUUID] = useState("12345678-1234-5678-1234-56789abcdef2");

//   const [messages, setMessages] = useState<ReceivedMessage[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   const deviceRef = useRef<BluetoothDevice | null>(null);
//   const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

//   function onCharacteristicValueChanged(event: Event) {
//     const target = event.target as BluetoothRemoteGATTCharacteristic;
//     if (target?.value) {
//       appendMessage(target.value as DataView);
//     }
//   }

//   async function connect() {
//     setError(null);
//     if (!navigator.bluetooth) {
//       setError('Web Bluetooth API not available in this browser. Use Chrome or Edge.');
//       return;
//     }

//     try {
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
//         service = await server.getPrimaryService(charUUID.trim());
//       } else {
//         setError('Please provide a service UUID or characteristic UUID.');
//         return;
//       }

//       if (!charUUID.trim()) {
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
//         } catch {
//           // ignore
//         }
//         characteristicRef.current.removeEventListener('characteristicvaluechanged', onCharacteristicValueChanged as EventListener);
//         characteristicRef.current = null;
//       }
//       if (deviceRef.current?.gatt?.connected) {
//         deviceRef.current.gatt.disconnect();
//       }
//       deviceRef.current = null;
//       setConnected(false);
//       setDeviceName(null);
//     } catch {
//       // ignore
//     }
//   }
