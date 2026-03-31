let socket: WebSocket | null = null;
let urlCache = '';
let listeners = new Set<(msg: string) => void>();
let connected = false;
let retryDelayMs = 3000;
let retryTimeout: ReturnType<typeof setTimeout> | null = null;

// NEW: watchdog for CONNECTING
let connectWatchdog: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;
const CONNECT_TIMEOUT_MS = 3000;

function clearTimers() {
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
  if (connectWatchdog) {
    clearTimeout(connectWatchdog);
    connectWatchdog = null;
  }
}
//

function scheduleReconnect(reason: string) {
  console.log("[IMU WS] scheduling reconnect because: ", reason);
  if (retryTimeout) clearTimeout(retryTimeout);
  retryTimeout = setTimeout(() => {
    retryDelayMs = Math.min(5000, retryDelayMs * 1.8);
    connect(urlCache);
  }, retryDelayMs);
}

function connect(url: string) {
  // Check whether the socket reconnects on every reset
  if (socket) {
    console.log("[IMU WS] existing socket state:", socket.readyState);
  } else {
    console.log("[IMU WS] socket is null");
  }
  
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  urlCache = url;
  console.log("Attempting to open new socket...");

  // New for watchdog
  if (inFlight) return;
  inFlight = true;
  console.log("[IMU WS] opening:", url);
  clearTimers();
  //

  let ws: WebSocket;
  try {
    ws = new WebSocket(url);
  } catch (e) {
    console.warn("[IMU WS] new WebSocket threw:", e);
    socket = null;
    scheduleReconnect("WebSocket threw error");
    return;
  }

  socket = ws;
  
  // WATCHDOG: if still CONNECTING after timeout, force-close and retry
  connectWatchdog = setTimeout(() => {
    if (!socket) return;
    if (socket.readyState === WebSocket.CONNECTING) {
      console.warn("[IMU WS] connect timeout -> forcing close + retry");
      try { socket.close(); } catch {}
      socket = null;
      connected = false;
      scheduleReconnect("connect timeout");
    }
  }, CONNECT_TIMEOUT_MS);

    ws.onopen = () => {
    connected = true;
    retryDelayMs = 500;  // original is 500
    inFlight = false;
    console.log("Just opened IMU socket!");
    if (connectWatchdog) { clearTimeout(connectWatchdog); connectWatchdog = null; }

    // // Setup a ping from the browser to keep a socket alive
    // const pingId = setInterval(() => {
    //   if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    // }, 1000);
    };

    ws.onmessage = (e) => {
    const data = typeof e.data === 'string' ? e.data : '';
    listeners.forEach(fn => fn(data));
    };

    ws.onerror = (e) => {
    console.warn("[IMU WS] error", e);
    // onerror often precedes onclose; let onclose do the reconnect
  };

  ws.onclose = (e) => {
    console.warn("[IMU WS] close", e.code, e.reason);
    if (connectWatchdog) { clearTimeout(connectWatchdog); connectWatchdog = null; }
    socket = null;
    inFlight = false;
    connected = false;
    scheduleReconnect(`close ${e.code}`);
  };

    // clean up on page close so ESP frees the socket
  window.addEventListener('beforeunload', () => { try { ws.close(); socket = null; connected = false; } catch {} }, { once: true });
  // window.addEventListener('beforeunload', () => { try { ws.close(); } catch {} }, { once: true });

}

export function ensureImuSocket() {
  // const url = 'ws://192.168.4.1/imu'  // this works wih original IMU code
  const url = 'ws://192.168.4.1:81/imu'  // this works when IMU data are on same stream as camera
  connect(url); // via CRA proxy
}

export function subscribeImu(cb: (msg: string) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function isImuConnected() { return connected; }
