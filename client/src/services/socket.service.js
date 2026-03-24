import { io } from 'socket.io-client';

const DEFAULT_SOCKET_URL = 'https://wabizpro.onrender.com';

class SocketService {
  socket = null;

  connect(businessId) {
    if (this.socket?.connected) {
      if (businessId) this.socket.emit('join_business', businessId);
      return this.socket;
    }

    const baseUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') ||
      DEFAULT_SOCKET_URL;

    this.socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      if (businessId) this.socket.emit('join_business', businessId);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketService = new SocketService();

export default socketService;
