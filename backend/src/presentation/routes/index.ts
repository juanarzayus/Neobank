import { type RequestHandler, Router } from 'express';
import type { AccountController } from '../controllers/AccountController';
import type { AuthController } from '../controllers/AuthController';
import type { HealthController } from '../controllers/HealthController';
import type { VirtualCardController } from '../controllers/VirtualCardController';
import { createAccountRoutes } from './accountRoutes';
import { createAuthRoutes } from './authRoutes';
import { createCardRoutes } from './cardRoutes';
import { createHealthRoutes } from './healthRoutes';

export interface HttpControllers {
  auth: AuthController;
  accounts: AccountController;
  cards: VirtualCardController;
  health: HealthController;
}

/** Montado en /api/v1 */
export const createApiRouter = (controllers: HttpControllers, requireAuth: RequestHandler): Router => {
  const router = Router();
  router.use('/health', createHealthRoutes(controllers.health));
  router.use('/auth', createAuthRoutes(controllers.auth, requireAuth));
  router.use('/cards', createCardRoutes(controllers.cards, requireAuth));
  router.use('/accounts', createAccountRoutes(controllers.accounts, requireAuth));
  return router;
};
