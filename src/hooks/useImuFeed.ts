import { useEffect, useState } from 'react';
import { ensureImuSocket, subscribeImu, isImuConnected } from '../ws/imuSocket';

export default function useImuFeed() {
  const [connected, setConnected] = useState(isImuConnected());
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log("Running useEffect() in useImuFeed")
    ensureImuSocket(); // creates/keeps a single connection for the whole app
    const unsub = subscribeImu((msg) => setLastMessage(msg));
    // poll connection flag lightly (optional)
    const id = setInterval(() => setConnected(isImuConnected()), 500);
    return () => { unsub(); clearInterval(id); };
  }, []);

  return { connected, lastMessage };
}
