import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { DomainError, type DomainErrorKind } from '../../domain/errors/DomainError';

/** Traducción de errores del dominio a códigos HTTP: el dominio no conoce HTTP. */
const STATUS_BY_KIND: Record<DomainErrorKind, number> = {
  VALIDATION: 400,
  BUSINESS_RULE: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

/** Express 4 no captura promesas rechazadas: este wrapper las envía al error handler. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof DomainError) {
    res.status(STATUS_BY_KIND[err.kind]).json({ message: err.message });
    return;
  }
  // Cuerpo JSON mal formado (lo detecta express.json()).
  if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
};
