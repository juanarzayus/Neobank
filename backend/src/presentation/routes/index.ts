import { Router } from 'express';
import { accountRoutes } from './accountRoutes';
import { authRoutes } from './authRoutes';
import { cardRoutes } from './cardRoutes';
import { healthRoutes } from './healthRoutes';

/** Montado en /api/v1 */
export const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/cards', cardRoutes);
apiRouter.use('/accounts', accountRoutes);
