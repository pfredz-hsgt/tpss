import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const connectSocket = (userId: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket?.emit('authenticate', userId);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

