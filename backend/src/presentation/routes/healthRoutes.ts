import { Router } from 'express';
import type { HealthController } from '../controllers/HealthController';
import { asyncHandler } from '../middlewares/errorHandlerMiddleware';

export const createHealthRoutes = (controller: HealthController): Router => {
  const router = Router();
  router.get('/', controller.status);
  router.get('/db', asyncHandler(controller.database));
  return router;
};
