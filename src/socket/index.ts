import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/env';

let socket: Socket | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

const HEARTBEAT_INTERVAL_MS = 30_000;

function startHeartbeat(s: Socket): void {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (s.connected) s.emit('presence:heartbeat');
  }, HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export function connectSocket(token: string): Socket {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    if (socket) socket.emit('presence:heartbeat');
  });

  startHeartbeat(socket);

  return socket;
}

export function disconnectSocket(): void {
  stopHeartbeat();
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
