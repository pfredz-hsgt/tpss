import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import publicRoutes from './routes/public';
import announcementRoutes from './routes/announcements';
import passoverRoutes from './routes/passover';
import notificationRoutes from './routes/notifications';
import temperatureRoutes from './routes/temperature';
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/passover', passoverRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/temperature', temperatureRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join user-specific room when authenticated
  socket.on('authenticate', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in other modules
export { io };

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

