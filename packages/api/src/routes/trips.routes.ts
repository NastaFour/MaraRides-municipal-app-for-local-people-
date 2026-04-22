import { Router } from 'express';
import {
  createTrip,
  acceptTrip,
  completeTrip,
  cancelTrip,
  getTrips
} from '../controllers/trips.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Client routes
router.post('/', authMiddleware, requireRole('CLIENT'), createTrip);
router.patch('/:id/cancel', authMiddleware, requireRole('CLIENT', 'ADMIN'), cancelTrip);

// Driver routes
router.patch('/:id/accept', authMiddleware, requireRole('DRIVER'), acceptTrip);
router.patch('/:id/complete', authMiddleware, requireRole('DRIVER'), completeTrip);

// Shared/Admin routes
router.get('/', authMiddleware, getTrips);

export default router;
