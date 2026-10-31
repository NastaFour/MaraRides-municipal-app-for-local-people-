import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { TripStatus, DriverStatus, PaymentMethod } from '@prisma/client';
import { calculateFare } from '../lib/fare';
import { io } from '../index';

/**
 * Estimate fare and distance before requesting a trip
 */
export const estimateTrip = async (req: Request, res: Response) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.body;

    if (originLat == null || originLng == null || destLat == null || destLng == null) {
      return res.status(400).json({ success: false, message: 'Coordenadas de origen y destino requeridas' });
    }

    const estimate = calculateFare(
      Number(originLat),
      Number(originLng),
      Number(destLat),
      Number(destLng)
    );

    return res.json({ success: true, data: estimate });
  } catch (error: any) {
    console.error('Error al estimar tarifa:', error);
    return res.status(500).json({ success: false, message: 'Error al calcular estimación de viaje' });
  }
};

/**
 * Client requests a new mototaxi trip
 */
export const createTrip = async (req: Request, res: Response) => {
  try {
    const clientId = req.user!.id;
    const {
      originLat,
      originLng,
      destLat,
      destLng,
      originAddress,
      destAddress,
      paymentMethod = PaymentMethod.CASH,
    } = req.body;

    if (!originLat || !originLng || !destLat || !destLng || !originAddress || !destAddress) {
      return res.status(400).json({ success: false, message: 'Faltan datos de origen o destino' });
    }

    // Verify client doesn't already have an uncompleted trip
    const uncompletedTrip = await prisma.trip.findFirst({
      where: {
        clientId,
        status: { in: [TripStatus.REQUESTED, TripStatus.ACCEPTED, TripStatus.IN_PROGRESS] },
      },
    });

    if (uncompletedTrip) {
      return res.status(409).json({
        success: false,
        message: 'Ya tienes un viaje en curso',
        data: uncompletedTrip,
      });
    }

    // Automatically calculate distance and municipal fare
    const estimate = calculateFare(
      Number(originLat),
      Number(originLng),
      Number(destLat),
      Number(destLng)
    );

    const trip = await prisma.trip.create({
      data: {
        clientId,
        originLat: Number(originLat),
        originLng: Number(originLng),
        destLat: Number(destLat),
        destLng: Number(destLng),
        originAddress: String(originAddress).trim(),
        destAddress: String(destAddress).trim(),
        distanceKm: estimate.distanceKm,
        durationMin: estimate.durationMin,
        fare: estimate.fare,
        paymentMethod: paymentMethod in PaymentMethod ? paymentMethod : PaymentMethod.CASH,
        status: TripStatus.REQUESTED,
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
      },
    });

    // Notify online drivers in real time via Socket.io
    io.to('online-drivers').emit('trip:new', { trip });
    io.to('dashboard').emit('trip:new', { trip });

    return res.status(201).json({ success: true, data: trip });
  } catch (error) {
    console.error('Error al solicitar viaje:', error);
    return res.status(500).json({ success: false, message: 'Error al solicitar el viaje' });
  }
};

/**
 * Driver accepts a requested trip with concurrency protection
 */
export const acceptTrip = async (req: Request, res: Response) => {
  try {
    const driverId = req.user!.id;
    const { id: tripId } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { vehicle: true },
    });

    if (!driver?.isApproved) {
      return res.status(403).json({ success: false, message: 'No estás aprobado por la municipalidad para operar' });
    }

    if (driver.status === DriverStatus.IN_TRIP) {
      return res.status(409).json({ success: false, message: 'Ya tienes un viaje activo en curso' });
    }

    // Atomic transaction: verify status is still REQUESTED before assigning via updateMany
    const trip = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.trip.updateMany({
        where: { id: tripId, status: TripStatus.REQUESTED },
        data: {
          driverId,
          status: TripStatus.ACCEPTED,
        },
      });

      if (updateResult.count === 0) {
        throw new Error('VIAJE_NO_DISPONIBLE');
      }

      await tx.driver.update({
        where: { id: driverId },
        data: { status: DriverStatus.IN_TRIP },
      });

      const updatedTrip = await tx.trip.findUnique({
        where: { id: tripId },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              ratingAvg: true,
              totalTrips: true,
              vehicle: true,
              latitude: true,
              longitude: true,
            },
          },
          client: { select: { id: true, name: true, phone: true } },
        },
      });

      return updatedTrip!;
    });

    // Notify client and dashboard
    io.to(`user:${trip.clientId}`).emit('trip:accepted', { trip });
    io.to(`trip:${trip.id}`).emit('trip:status_changed', { tripId: trip.id, status: TripStatus.ACCEPTED, trip });
    io.to('dashboard').emit('trip:status_changed', { tripId: trip.id, status: TripStatus.ACCEPTED, trip });

    return res.json({ success: true, data: trip });
  } catch (error: any) {
    if (error.message === 'VIAJE_NO_DISPONIBLE') {
      return res.status(409).json({ success: false, message: 'El viaje ya fue tomado por otro conductor o cancelado' });
    }
    console.error('Error al aceptar viaje:', error);
    return res.status(500).json({ success: false, message: 'Error al aceptar el viaje' });
  }
};

/**
 * Driver arrives at pickup and starts the trip (client boarded the mototaxi)
 */
export const startTrip = async (req: Request, res: Response) => {
  try {
    const driverId = req.user!.id;
    const { id: tripId } = req.params;

    const trip = await prisma.$transaction(async (tx) => {
      const currentTrip = await tx.trip.findUnique({ where: { id: tripId } });

      if (!currentTrip) throw new Error('NOT_FOUND');
      if (currentTrip.driverId !== driverId) throw new Error('FORBIDDEN');
      if (currentTrip.status !== TripStatus.ACCEPTED) throw new Error('INVALID_STATUS');

      return tx.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
        include: {
          driver: { select: { id: true, name: true, phone: true, vehicle: true, latitude: true, longitude: true } },
          client: { select: { id: true, name: true, phone: true } },
        },
      });
    });

    // Notify client, trip room, and dashboard
    io.to(`user:${trip.clientId}`).emit('trip:started', { trip });
    io.to(`trip:${trip.id}`).emit('trip:status_changed', { tripId: trip.id, status: TripStatus.IN_PROGRESS, trip });
    io.to('dashboard').emit('trip:status_changed', { tripId: trip.id, status: TripStatus.IN_PROGRESS, trip });

    return res.json({ success: true, data: trip });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
    if (error.message === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'Viaje no asignado a ti' });
    if (error.message === 'INVALID_STATUS') {
      return res.status(400).json({ success: false, message: 'El viaje debe estar en estado ACEPTADO para iniciar' });
    }
    console.error('Error al iniciar viaje:', error);
    return res.status(500).json({ success: false, message: 'Error al iniciar el viaje' });
  }
};

/**
 * Driver completes the trip at destination
 */
export const completeTrip = async (req: Request, res: Response) => {
  try {
    const driverId = req.user!.id;
    const { id: tripId } = req.params;

    const trip = await prisma.$transaction(async (tx) => {
      const currentTrip = await tx.trip.findUnique({ where: { id: tripId } });

      if (!currentTrip) throw new Error('NOT_FOUND');
      if (currentTrip.driverId !== driverId) throw new Error('FORBIDDEN');
      if (currentTrip.status === TripStatus.COMPLETED) throw new Error('ALREADY_COMPLETED');

      // Set driver back to ONLINE and increment trip count
      await tx.driver.update({
        where: { id: driverId },
        data: {
          status: DriverStatus.ONLINE,
          totalTrips: { increment: 1 },
        },
      });

      return tx.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          driver: { select: { id: true, name: true, phone: true, vehicle: true } },
          client: { select: { id: true, name: true, phone: true } },
          rating: true,
        },
      });
    });

    // Notify client, trip room, and dashboard
    io.to(`user:${trip.clientId}`).emit('trip:completed', { trip });
    io.to(`trip:${trip.id}`).emit('trip:status_changed', { tripId: trip.id, status: TripStatus.COMPLETED, trip });
    io.to('dashboard').emit('trip:status_changed', { tripId: trip.id, status: TripStatus.COMPLETED, trip });

    return res.json({ success: true, data: trip });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
    if (error.message === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'Viaje no asignado a ti' });
    if (error.message === 'ALREADY_COMPLETED') return res.status(400).json({ success: false, message: 'El viaje ya fue completado' });
    console.error('Error al completar viaje:', error);
    return res.status(500).json({ success: false, message: 'Error al completar el viaje' });
  }
};

/**
 * Cancel trip by client or admin
 */
export const cancelTrip = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id: tripId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });

    if (!trip) return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
      return res.status(400).json({ success: false, message: 'No se puede cancelar un viaje completado o cancelado' });
    }

    if (userRole === 'CLIENT' && trip.clientId !== userId) {
      return res.status(403).json({ success: false, message: 'No autorizado para cancelar este viaje' });
    }

    const updatedTrip = await prisma.$transaction(async (tx) => {
      const cancelResult = await tx.trip.updateMany({
        where: {
          id: tripId,
          status: { in: [TripStatus.REQUESTED, TripStatus.ACCEPTED] },
        },
        data: { status: TripStatus.CANCELLED },
      });

      if (cancelResult.count === 0) {
        throw new Error('CANNOT_CANCEL');
      }

      if (trip.driverId) {
        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: DriverStatus.ONLINE },
        });
      }

      return tx.trip.findUnique({ where: { id: tripId } });
    });

    if (trip.driverId) {
      io.to(`user:${trip.driverId}`).emit('trip:cancelled', { tripId });
    }
    io.to(`trip:${tripId}`).emit('trip:status_changed', { tripId, status: TripStatus.CANCELLED, trip: updatedTrip });
    io.to('dashboard').emit('trip:status_changed', { tripId, status: TripStatus.CANCELLED, trip: updatedTrip });

    return res.json({ success: true, message: 'Viaje cancelado exitosamente' });
  } catch (error) {
    console.error('Error al cancelar viaje:', error);
    return res.status(500).json({ success: false, message: 'Error al cancelar el viaje' });
  }
};

/**
 * Client rates driver after completed trip
 */
export const rateTrip = async (req: Request, res: Response) => {
  try {
    const clientId = req.user!.id;
    const { id: tripId } = req.params;
    const { score, comment } = req.body;

    const numericScore = Number(score);
    if (!numericScore || numericScore < 1 || numericScore > 5) {
      return res.status(400).json({ success: false, message: 'La calificación debe ser entre 1 y 5 estrellas' });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { rating: true },
    });

    if (!trip) return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
    if (trip.clientId !== clientId) return res.status(403).json({ success: false, message: 'No autorizado' });
    if (trip.status !== TripStatus.COMPLETED) {
      return res.status(400).json({ success: false, message: 'Solo se pueden calificar viajes completados' });
    }
    if (trip.rating) {
      return res.status(409).json({ success: false, message: 'Este viaje ya fue calificado' });
    }
    if (!trip.driverId) {
      return res.status(400).json({ success: false, message: 'El viaje no tiene un conductor asociado' });
    }

    const driverId = trip.driverId;

    const rating = await prisma.$transaction(async (tx) => {
      const createdRating = await tx.rating.create({
        data: {
          tripId,
          clientId,
          driverId,
          score: Math.round(numericScore),
          comment: comment ? String(comment).trim() : null,
        },
      });

      // Recalculate average rating for driver
      const driverRatings = await tx.rating.findMany({
        where: { driverId },
        select: { score: true },
      });

      const avg =
        driverRatings.reduce((sum, r) => sum + r.score, 0) / (driverRatings.length || 1);

      await tx.driver.update({
        where: { id: driverId },
        data: { ratingAvg: Math.round(avg * 10) / 10 },
      });

      return createdRating;
    });

    io.to(`user:${driverId}`).emit('trip:rated', { tripId, rating });
    io.to('dashboard').emit('trip:rated', { tripId, rating });

    return res.status(201).json({ success: true, data: rating });
  } catch (error) {
    console.error('Error al calificar viaje:', error);
    return res.status(500).json({ success: false, message: 'Error al registrar calificación' });
  }
};

/**
 * Get trips with filters and role authorization
 */
export const getTrips = async (req: Request, res: Response) => {
  try {
    const { id, role } = req.user!;
    const { status } = req.query;

    let whereCondition: any = {};

    if (role === 'CLIENT') whereCondition.clientId = id;
    else if (role === 'DRIVER') whereCondition.driverId = id;

    if (status && typeof status === 'string' && status in TripStatus) {
      whereCondition.status = status as TripStatus;
    }

    const trips = await prisma.trip.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            ratingAvg: true,
            totalTrips: true,
            vehicle: true,
          },
        },
        client: { select: { id: true, name: true, phone: true } },
        rating: true,
      },
    });

    return res.json({ success: true, data: trips });
  } catch (error) {
    console.error('Error al obtener viajes:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener viajes' });
  }
};

/**
 * Get single trip by ID
 */
export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id: tripId } = req.params;
    const { id: userId, role } = req.user!;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            ratingAvg: true,
            totalTrips: true,
            vehicle: true,
            latitude: true,
            longitude: true,
          },
        },
        client: { select: { id: true, name: true, phone: true } },
        rating: true,
      },
    });

    if (!trip) return res.status(404).json({ success: false, message: 'Viaje no encontrado' });

    if (role === 'CLIENT' && trip.clientId !== userId) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }
    if (role === 'DRIVER' && trip.driverId !== userId && trip.status !== TripStatus.REQUESTED) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    return res.json({ success: true, data: trip });
  } catch (error) {
    console.error('Error al obtener viaje por ID:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener detalle del viaje' });
  }
};
