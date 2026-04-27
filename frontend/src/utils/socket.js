import { io } from 'socket.io-client';

let socket = null;

function resolveSocketUrl() {
  // Remove env-based URL to force dynamic resolution
  const { protocol, hostname } = window.location;
  const socketProtocol = protocol === 'https:' ? 'https:' : 'http:';
  return `${socketProtocol}//${hostname}:5000`;
}

export const getSocket = () => {
  if (!socket || socket.disconnected) {
    socket = io(resolveSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};