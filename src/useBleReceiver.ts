import { useCallback, useEffect, useRef, useState } from "react";

type UseBleReceiverOpts = {
  serviceUuid: BluetoothServiceUUID;
  characteristicUuid: BluetoothCharacteristicUUID;
  // Optional: show only devices with a name prefix, e.g. "ADS1299"
  namePrefix?: string;
  onData?: (bytes: Uint8Array, dv: DataView) => void;
};

export function useBleReceiver(opts: UseBleReceiverOpts) {
  const { serviceUuid, characteristicUuid, namePrefix, onData } = opts;

  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const charRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  const handleDisconnectRef = useRef<(this: BluetoothDevice, ev: Event) => any>();

  const disconnect = useCallback(() => {
    const dev = deviceRef.current;
    if (dev?.gatt?.connected) dev.gatt.disconnect();
    setConnected(false);
  }, []);

  const connect = useCallback(async () => {
    setError(null);

    if (!navigator.bluetooth) {
      setError("Web Bluetooth is not supported in this browser.");
      return;
    }

    try {
      const filters: BluetoothLEScanFilter[] = [];
      if (namePrefix) filters.push({ namePrefix, services: [serviceUuid] });
      else filters.push({ services: [serviceUuid] });

      const device = await navigator.bluetooth.requestDevice({
        filters,
        // If you use acceptAllDevices: true, you MUST include optionalServices: [serviceUuid]
        // acceptAllDevices: true,
        // optionalServices: [serviceUuid],
      });

      deviceRef.current = device;
      setDeviceName(device.name ?? "Unnamed device");

      const onDisconnected = () => {
        setConnected(false);
      };
      handleDisconnectRef.current = onDisconnected;
      device.addEventListener("gattserverdisconnected", onDisconnected);

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(serviceUuid);
      const ch = await service.getCharacteristic(characteristicUuid);
      charRef.current = ch;

      const onValueChanged = (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const dv = target.value!;
        const bytes = new Uint8Array(dv.buffer.slice(dv.byteOffset, dv.byteOffset + dv.byteLength));
        onData?.(bytes, dv);
      };

      ch.addEventListener("characteristicvaluechanged", onValueChanged);
      await ch.startNotifications();

      setConnected(true);

      // store cleanup function by attaching to ref (simple pattern)
      (ch as any).__onValueChanged = onValueChanged;
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setConnected(false);
    }
  }, [serviceUuid, characteristicUuid, namePrefix, onData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const dev = deviceRef.current;
      const ch = charRef.current as any;

      if (dev && handleDisconnectRef.current) {
        dev.removeEventListener("gattserverdisconnected", handleDisconnectRef.current);
      }
      if (ch?.__onValueChanged) {
        (charRef.current as any)?.removeEventListener("characteristicvaluechanged", ch.__onValueChanged);
      }
      try {
        if (dev?.gatt?.connected) dev.gatt.disconnect();
      } catch {
        // ignore
      }
    };
  }, []);

  return { connect, disconnect, connected, deviceName, error };
}
