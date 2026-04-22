// ============================================================
// Socket Service — packages/dashboard
// Lazy singleton: only connects when first imported
// Stack: socket.io-client (approved in package.json)
// ============================================================

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('auth_token');
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// ── Socket event constants to avoid typos ──
export const SOCKET_EVENTS = {
  DRIVER_ONLINE:   'driver:online',
  DRIVER_OFFLINE:  'driver:offline',
  DRIVER_LOCATION: 'driver:location',
  TRIP_NEW:        'trip:new',
  TRIP_ACCEPTED:   'trip:accepted',
  TRIP_COMPLETED:  'trip:completed',
} as const;

export interface DriverLocationPayload {
  driverId: string;
  lat: number;
  lng: number;
  status: 'ONLINE' | 'OFFLINE' | 'IN_TRIP';
}
