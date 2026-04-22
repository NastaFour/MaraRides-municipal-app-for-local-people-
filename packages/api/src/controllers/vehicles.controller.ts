import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { plate, model, year, driverId } = req.body;

    if (!plate || !model || !year || !driverId) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    // Check if plate already exists
    const existing = await prisma.vehicle.findUnique({ where: { plate } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Esta placa ya está registrada' });
    }

    const vehicle = await prisma.vehicle.create({
      data: { plate, model, year: Number(year), driverId },
    });

    return res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const getDriverVehicles = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    
    // Auth Check: A driver can only see their own vehicles, admin can see any
    if (req.user!.role === 'DRIVER' && req.user!.id !== driverId) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { driverId }
    });

    return res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
