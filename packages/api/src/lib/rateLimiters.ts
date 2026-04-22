import { rateLimit } from 'express-rate-limit';

/** Rate limiter estricto para endpoints de autenticación (10 req/min) */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos. Espera 1 minuto.' },
});

/** Rate limiter global (200 req/15min) */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
});
