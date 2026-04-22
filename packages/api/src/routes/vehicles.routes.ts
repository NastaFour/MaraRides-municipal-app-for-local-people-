import { Router } from 'express';
import { createVehicle, getDriverVehicles } from '../controllers/vehicles.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.post('/', authMiddleware, requireRole('ADMIN'), createVehicle);
router.get('/:driverId', authMiddleware, getDriverVehicles);

export default router;
