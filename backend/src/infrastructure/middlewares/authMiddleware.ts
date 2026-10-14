import type { RequestHandler } from 'express';
import { verifyToken } from '../security/token';
import { AppError } from './errorHandlerMiddleware';

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifyToken(token, 'access') : null;

  if (!payload) return next(new AppError(401, 'No autenticado'));

  res.locals.userId = payload.sub;
  next();
};
