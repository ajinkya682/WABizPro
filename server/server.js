const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Socket.IO CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);
  socket.on('join_business', (businessId) => { socket.join(businessId); });
  socket.on('disconnect', () => console.log('❌ Socket disconnected:', socket.id));
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 WABiz Pro Server Started`);
    console.log(`✅ Port: ${PORT}`);
    console.log(`✅ Socket.io: enabled`);
    console.log(`✅ API: http://localhost:${PORT}/api`);
    console.log(`🌍 Env: ${process.env.NODE_ENV}\n`);
  });
});
