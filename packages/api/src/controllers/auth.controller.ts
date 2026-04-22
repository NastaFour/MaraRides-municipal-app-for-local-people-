import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';
import { AuthPayload, ApiResponse } from '@mototaxi/shared';

function generateToken(id: string, role: string) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET!, { 
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
  });
}

export const registerClient = async (req: Request, res: Response) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'El teléfono ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, phone, password: hashedPassword, role: Role.CLIENT },
      select: { id: true, name: true, phone: true, role: true },
    });

    const token = generateToken(user.id, user.role);

    return res.status(201).json({
      success: true,
      data: { token, user },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const token = generateToken(user.id, user.role);
    const { password: _, ...userWithoutPass } = user;

    return res.json({
      success: true,
      data: { token, user: userWithoutPass },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const registerDriver = async (req: Request, res: Response) => {
  try {
    const { name, phone, password, licenseNum, vehicle } = req.body;

    if (!name || !phone || !password || !licenseNum || !vehicle) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    const existingUser = await prisma.driver.findFirst({
      where: { OR: [{ phone }, { licenseNum }] }
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Teléfono o licencia ya registrados' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = await prisma.$transaction(async (tx) => {
      const newDriver = await tx.driver.create({
        data: { name, phone, password: hashedPassword, licenseNum },
      });

      await tx.vehicle.create({
        data: {
          plate: vehicle.plate,
          model: vehicle.model,
          year: Number(vehicle.year),
          driverId: newDriver.id,
        },
      });

      return newDriver;
    });

    const token = generateToken(driver.id, 'DRIVER');

    return res.status(201).json({
      success: true,
      data: {
        token,
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          status: driver.status,
          isApproved: driver.isApproved
        }
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al registrar conductor' });
  }
};

export const loginDriver = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    const driver = await prisma.driver.findUnique({ where: { phone } });
    if (!driver) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const token = generateToken(driver.id, 'DRIVER');

    return res.json({
      success: true,
      data: {
        token,
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          status: driver.status,
          isApproved: driver.isApproved
        }
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const { id, role } = req.user!;

    if (role === 'DRIVER') {
      const driver = await prisma.driver.findUnique({
        where: { id },
        select: { id: true, name: true, phone: true, status: true, isApproved: true, licenseNum: true, vehicle: true }
      });
      return res.json({ success: true, data: { driver } });
    } else {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, phone: true, role: true }
      });
      return res.json({ success: true, data: { user } });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
