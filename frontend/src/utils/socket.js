import { io } from 'socket.io-client';

let socket = null;

function resolveSocketUrl() {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }

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