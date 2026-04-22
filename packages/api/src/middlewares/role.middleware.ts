import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from './auth.middleware';

type AllowedRole = 'ADMIN' | 'CLIENT' | 'DRIVER';

/**
 * Factory middleware that restricts access to specific roles.
 * Must be used after authMiddleware.
 * @example router.get('/admin', authMiddleware, requireRole('ADMIN'), handler)
 */
export function requireRole(...roles: AllowedRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as JwtPayload | undefined;

    if (!user) {
      res.status(401).json({ success: false, message: 'No autenticado.' });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}.`,
      });
      return;
    }

    next();
  };
}
