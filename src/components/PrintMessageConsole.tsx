// src/components/ImuConsole.tsx
import React from "react";
// import useWebSocketFeed from "../hooks/useWebSocketFeed";
import useImuFeed from '../hooks/useImuFeed';

type Props = {
  // e.g. "/imu" if you use the Vite proxy, or "ws://192.168.4.1/imu" for direct
  wsUrl: string;
};

export default function PrintMessageConsole() {
  // console.log("Running PrintMessageConsole")
  const { connected, lastMessage } = useImuFeed();

  return (
    <div style={{ fontFamily: "monospace", padding: 12, background: "#111", color: "#0f0", borderRadius: 8 }}>
      <div>WS: {connected ? "connected" : "disconnected"}</div>
      <div style={{ marginTop: 8 }}>
        {lastMessage ? lastMessage : "Waiting for data…"}
      </div>
    </div>
  );
}
