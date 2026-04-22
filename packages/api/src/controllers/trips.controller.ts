import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { TripStatus, DriverStatus } from '@prisma/client';
import { io } from '../index';

export const createTrip = async (req: Request, res: Response) => {
  try {
    const clientId = req.user!.id;
    const { originLat, originLng, destLat, destLng, originAddress, destAddress, fare } = req.body;

    if (!originLat || !originLng || !destLat || !destLng || !originAddress || !destAddress) {
      return res.status(400).json({ success: false, message: 'Faltan datos de origen o destino' });
    }

    const uncompletedTrip = await prisma.trip.findFirst({
      where: {
        clientId,
        status: { in: [TripStatus.REQUESTED, TripStatus.ACCEPTED, TripStatus.IN_PROGRESS] }
      }
    });

    if (uncompletedTrip) {
      return res.status(409).json({ success: false, message: 'Ya tienes un viaje en curso' });
    }

    const trip = await prisma.trip.create({
      data: {
        clientId,
        originLat,
        originLng,
        destLat,
        destLng,
        originAddress,
        destAddress,
        fare,
        status: TripStatus.REQUESTED,
      },
      include: { client: { select: { name: true, phone: true } } }
    });

    // Phase 3: Emit socket event to online drivers
    io.to('online-drivers').emit('trip:new', { trip });

    return res.status(201).json({ success: true, data: trip });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al solicitar el viaje' });
  }
};

export const acceptTrip = async (req: Request, res: Response) => {
  try {
    const driverId = req.user!.id;
    const { id: tripId } = req.params;

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver?.isApproved) {
      return res.status(403).json({ success: false, message: 'No estás aprobado para tomar viajes' });
    }
    if (driver.status === DriverStatus.IN_TRIP) {
      return res.status(409).json({ success: false, message: 'Ya tienes un viaje en curso' });
    }

    const trip = await prisma.$transaction(async (tx) => {
      const currentTrip = await tx.trip.findUnique({ where: { id: tripId } });
      
      if (!currentTrip || currentTrip.status !== TripStatus.REQUESTED) {
        throw new Error('VIAJE_NO_DISPONIBLE');
      }

      await tx.driver.update({
        where: { id: driverId },
        data: { status: DriverStatus.IN_TRIP }
      });

      return tx.trip.update({
        where: { id: tripId },
        data: {
          driverId,
          status: TripStatus.ACCEPTED,
        },
        include: { driver: { select: { id: true, name: true, vehicle: true, phone: true } } }
      });
    });

    // Phase 3: Emit socket to client that trip was accepted
    io.to(`user:${trip.clientId}`).emit('trip:accepted', { trip });

    return res.json({ success: true, data: trip });
  } catch (error: any) {
    if (error.message === 'VIAJE_NO_DISPONIBLE') {
      return res.status(409).json({ success: false, message: 'El viaje ya fue tomado o cancelado' });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al aceptar el viaje' });
  }
};

export const completeTrip = async (req: Request, res: Response) => {
  try {
    const driverId = req.user!.id; // Only driver can complete
    const { id: tripId } = req.params;

    const trip = await prisma.$transaction(async (tx) => {
      const t = await tx.trip.findUnique({ where: { id: tripId } });
      if (t?.driverId !== driverId) throw new Error('NO_AUTORIZADO');
      if (t.status === TripStatus.COMPLETED) throw new Error('YA_COMPLETADO');

      await tx.driver.update({
        where: { id: driverId },
        data: { status: DriverStatus.ONLINE }
      });

      return tx.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.COMPLETED,
          completedAt: new Date(),
        }
      });
    });

    return res.json({ success: true, data: trip });
  } catch (error: any) {
    if (error.message === 'NO_AUTORIZADO') return res.status(403).json({ success: false, message: 'Viaje no asignado a ti' });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al completar el viaje' });
  }
};

export const cancelTrip = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: tripId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    
    if (!trip) return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
      return res.status(400).json({ success: false, message: 'No se puede cancelar en este estado' });
    }

    if (req.user!.role === 'CLIENT' && trip.clientId !== userId) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.CANCELLED }
      });

      if (trip.driverId) {
        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: DriverStatus.ONLINE }
        });
      }
    });

    return res.json({ success: true, message: 'Viaje cancelado exitosamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al cancelar el viaje' });
  }
};

export const getTrips = async (req: Request, res: Response) => {
  try {
    const { id, role } = req.user!;
    
    let whereCondition = {};
    if (role === 'CLIENT') whereCondition = { clientId: id };
    else if (role === 'DRIVER') whereCondition = { driverId: id };
    
    // Si es ADMIN obtiene todos

    const trips = await prisma.trip.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        driver: { select: { name: true, phone: true, vehicle: true } },
        client: { select: { name: true, phone: true } }
      }
    });

    return res.json({ success: true, data: trips });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al obtener viajes' });
  }
};
