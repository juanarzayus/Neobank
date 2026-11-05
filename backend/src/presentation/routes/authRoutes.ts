import { type RequestHandler, Router } from 'express';
import type { AuthController } from '../controllers/AuthController';
import { asyncHandler } from '../middlewares/errorHandlerMiddleware';

export const createAuthRoutes = (controller: AuthController, requireAuth: RequestHandler): Router => {
  const router = Router();
  router.post('/register', asyncHandler(controller.register));
  router.post('/login', asyncHandler(controller.login));
  router.post('/refresh', asyncHandler(controller.refresh));
  router.post('/logout', asyncHandler(controller.logout));
  router.get('/me', requireAuth, asyncHandler(controller.me));
  return router;
};
