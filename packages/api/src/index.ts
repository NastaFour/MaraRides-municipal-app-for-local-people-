import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { globalLimiter } from './lib/rateLimiters';
import authRoutes from './routes/auth.routes';
import driverRoutes from './routes/drivers.routes';
import tripRoutes from './routes/trips.routes';
import vehicleRoutes from './routes/vehicles.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true,
  })
);

// ─── Socket.io ────────────────────────────────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    methods: ['GET', 'POST'],
  },
});

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }));  // Prevents payload flooding attacks
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use(globalLimiter);


// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV ?? 'development',
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/drivers', driverRoutes);
app.use('/trips', tripRoutes);
app.use('/vehicles', vehicleRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status ?? err.statusCode ?? 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : (err.message ?? 'Error desconocido');

  console.error(`[${new Date().toISOString()}] ERROR ${status}:`, err.message);
  res.status(status).json({ success: false, message });
});

// ─── Socket Handlers ──────────────────────────────────────────────────────────
import { setupTrackingSockets } from './sockets/tracking.socket';
setupTrackingSockets(io);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 API running on http://${HOST}:${PORT}`);
  console.log(`🔌 Socket.io ready`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log(`🛡️  Environment: ${process.env.NODE_ENV ?? 'development'}`);
});
