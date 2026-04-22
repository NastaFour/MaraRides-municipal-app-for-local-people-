import { Router } from 'express';
import {
  getAllDrivers,
  getDriverById,
  approveDriver,
  updateDriverStatus
} from '../controllers/drivers.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Only ADMIN can see all drivers and approve them
router.get('/', authMiddleware, requireRole('ADMIN'), getAllDrivers);
router.get('/:id', authMiddleware, requireRole('ADMIN'), getDriverById);
router.patch('/:id/approve', authMiddleware, requireRole('ADMIN'), approveDriver);

// Drivers managing their own status
router.patch('/me/status', authMiddleware, requireRole('DRIVER'), updateDriverStatus);

export default router;
