import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { DriverStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';

export function setupTrackingSockets(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
    if (!token) return next(new Error('Authentication error'));
    
    try {
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET!);
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    console.log(`🔌 Socket conectado: ${user.id} (${user.role})`);

    socket.join(`user:${user.id}`);
    
    if (user.role === 'ADMIN') {
      socket.join('dashboard');
    }

    if (user.role === 'DRIVER') {
      socket.on('driver:online', async () => {
        socket.join('online-drivers');
        await prisma.driver.update({ where: { id: user.id }, data: { status: DriverStatus.ONLINE } });
        io.to('dashboard').emit('driver:status_changed', { driverId: user.id, status: DriverStatus.ONLINE });
        console.log(`🚕 Driver ${user.id} went online`);
      });

      socket.on('driver:offline', async () => {
        socket.leave('online-drivers');
        await prisma.driver.update({ where: { id: user.id }, data: { status: DriverStatus.OFFLINE } });
        io.to('dashboard').emit('driver:status_changed', { driverId: user.id, status: DriverStatus.OFFLINE });
        console.log(`🚕 Driver ${user.id} went offline`);
      });

      socket.on('driver:location', async (data: { lat: number, lng: number }) => {
        await prisma.driver.update({
          where: { id: user.id },
          data: { latitude: data.lat, longitude: data.lng }
        });
        
        // El dashboard escucha las ubicaciones de todos
        io.to('dashboard').emit('driver:location_update', { driverId: user.id, lat: data.lat, lng: data.lng });
        
        // Emite también en su canal propio para clientes siguiéndolo o un trip
        socket.broadcast.emit(`driver:location:${user.id}`, { lat: data.lat, lng: data.lng });
      });
    }

    // Los clientes se pueden suscribir a un viaje específico usando su room
    socket.on('trip:subscribe', (tripId: string) => {
      socket.join(`trip:${tripId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket desconectado: ${user.id}`);
    });
  });
}
