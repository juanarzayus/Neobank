import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

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
  if (err instanceof AppError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
};
