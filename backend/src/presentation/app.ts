import express, { type Express, type RequestHandler } from 'express';
import { createCorsMiddleware } from './middlewares/corsMiddleware';
import { errorHandler, notFoundHandler } from './middlewares/errorHandlerMiddleware';
import { createApiRouter, type HttpControllers } from './routes';

export interface HttpAppDeps {
  controllers: HttpControllers;
  requireAuth: RequestHandler;
  corsOrigin: string;
}

/** Adaptador de entrada HTTP: traduce peticiones a llamadas de casos de uso. */
export function createApp({ controllers, requireAuth, corsOrigin }: HttpAppDeps): Express {
  const app = express();

  app.use(createCorsMiddleware(corsOrigin));
  app.use(express.json());

  app.use('/api/v1', createApiRouter(controllers, requireAuth));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
