import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { DriverStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';

export function setupTrackingSockets(io: Server) {
  io.use((socket, next) => {
    const rawToken = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
    if (!rawToken) return next(new Error('Authentication token required'));

    try {
      const token = String(rawToken).replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Invalid or expired socket token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    if (!user?.id) {
      socket.disconnect(true);
      return;
    }

    // Join personal room for targeted push updates
    socket.join(`user:${user.id}`);

    if (user.role === 'ADMIN') {
      socket.join('dashboard');
    }

    if (user.role === 'DRIVER') {
      // Driver comes online
      socket.on('driver:online', async () => {
        try {
          socket.join('online-drivers');
          await prisma.driver.update({
            where: { id: user.id },
            data: { status: DriverStatus.ONLINE },
          });
          io.to('dashboard').emit('driver:status_changed', { driverId: user.id, status: DriverStatus.ONLINE });
        } catch (err) {
          console.error(`Error al poner driver online (${user.id}):`, err);
        }
      });

      // Driver goes offline
      socket.on('driver:offline', async () => {
        try {
          socket.leave('online-drivers');
          await prisma.driver.update({
            where: { id: user.id },
            data: { status: DriverStatus.OFFLINE },
          });
          io.to('dashboard').emit('driver:status_changed', { driverId: user.id, status: DriverStatus.OFFLINE });
        } catch (err) {
          console.error(`Error al poner driver offline (${user.id}):`, err);
        }
      });

      // Real-time GPS location telemetry
      socket.on('driver:location', async (data: { lat: number; lng: number; tripId?: string }) => {
        try {
          if (data?.lat == null || data?.lng == null) return;
          const lat = Number(data.lat);
          const lng = Number(data.lng);

          // Validate geographical coordinate bounds
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return;
          }

          await prisma.driver.update({
            where: { id: user.id },
            data: { latitude: lat, longitude: lng },
          });

          const payload = {
            driverId: user.id,
            lat,
            lng,
            timestamp: new Date().toISOString(),
          };

          // Broadcast to municipal dashboard
          io.to('dashboard').emit('driver:location_update', payload);

          // Broadcast to dedicated driver channel
          socket.broadcast.emit(`driver:location:${user.id}`, payload);

          // If driver is currently executing a trip, stream location directly to that trip room
          if (data.tripId) {
            io.to(`trip:${data.tripId}`).emit('trip:driver_location', {
              ...payload,
              tripId: data.tripId,
            });
          }
        } catch (err) {
          console.error(`Error al actualizar ubicación driver (${user.id}):`, err);
        }
      });
    }

    // Subscribe to a specific trip lifecycle room
    socket.on('trip:subscribe', (tripId: string) => {
      if (tripId) {
        socket.join(`trip:${tripId}`);
      }
    });

    socket.on('trip:unsubscribe', (tripId: string) => {
      if (tripId) {
        socket.leave(`trip:${tripId}`);
      }
    });

    socket.on('disconnect', async () => {
      // If a driver disconnected while ONLINE (and not in an active trip), transition to OFFLINE
      if (user.role === 'DRIVER') {
        try {
          const current = await prisma.driver.findUnique({
            where: { id: user.id },
            select: { status: true },
          });

          // Only mark offline if they were idle ONLINE, not IN_TRIP
          if (current?.status === DriverStatus.ONLINE) {
            await prisma.driver.update({
              where: { id: user.id },
              data: { status: DriverStatus.OFFLINE },
            });
            io.to('dashboard').emit('driver:status_changed', {
              driverId: user.id,
              status: DriverStatus.OFFLINE,
            });
          }
        } catch (err) {
          console.error(`Error al limpiar desconexión de conductor (${user.id}):`, err);
        }
      }
    });
  });
}
