import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { DriverStatus } from '@prisma/client';

export const getAllDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        licenseNum: true,
        status: true,
        isApproved: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        vehicle: true, // Include vehicle info
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: drivers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al obtener conductores' });
  }
};

export const getDriverById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        licenseNum: true,
        status: true,
        isApproved: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        vehicle: true,
      }
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Conductor no encontrado' });
    }

    return res.json({ success: true, data: driver });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const approveDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isApproved debe ser booleano' });
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { isApproved },
      select: { id: true, name: true, isApproved: true }
    });

    return res.json({ success: true, data: driver, message: isApproved ? 'Conductor aprobado' : 'Conductor desaprobado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al actualizar conductor' });
  }
};

export const updateDriverStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.user!; // Driver's own token
    const { status } = req.body;

    if (!Object.values(DriverStatus).includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado inválido' });
    }

    const currentDriver = await prisma.driver.findUnique({ where: { id } });
    if (!currentDriver?.isApproved && status === DriverStatus.ONLINE) {
      return res.status(403).json({ success: false, message: 'No puedes conectarte sin ser aprobado por un administrador' });
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { status },
      select: { id: true, status: true }
    });

    return res.json({ success: true, data: driver });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al actualizar estado' });
  }
};
