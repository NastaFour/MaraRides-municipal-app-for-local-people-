import { Router } from 'express';
import {
  estimateTrip,
  createTrip,
  acceptTrip,
  startTrip,
  completeTrip,
  cancelTrip,
  rateTrip,
  getTrips,
  getTripById,
} from '../controllers/trips.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Fare estimation
router.post('/estimate', authMiddleware, estimateTrip);

// Client operations
router.post('/', authMiddleware, requireRole('CLIENT'), createTrip);
router.post('/:id/rate', authMiddleware, requireRole('CLIENT'), rateTrip);
router.patch('/:id/cancel', authMiddleware, requireRole('CLIENT', 'ADMIN'), cancelTrip);

// Driver operations
router.patch('/:id/accept', authMiddleware, requireRole('DRIVER'), acceptTrip);
router.patch('/:id/start', authMiddleware, requireRole('DRIVER'), startTrip);
router.patch('/:id/complete', authMiddleware, requireRole('DRIVER'), completeTrip);

// General trip queries
router.get('/', authMiddleware, getTrips);
router.get('/:id', authMiddleware, getTripById);

export default router;
