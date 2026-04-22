import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

let socket: Socket | null = null;

export const connectSocket = async (userId: string) => {
  if (socket) return socket;

  const token = await getToken();
  const url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

  socket = io(url, {
    auth: { token },
    query: { userId },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('[SOCKET] Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('[SOCKET] Disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
