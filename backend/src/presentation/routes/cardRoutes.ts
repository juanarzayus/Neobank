import { Router } from 'express';
import { asyncHandler } from '../../infrastructure/middlewares/errorHandlerMiddleware';
import { requireAuth } from '../../infrastructure/middlewares/authMiddleware';
import { VirtualCardController } from '../controllers/VirtualCardController';

export const cardRoutes = Router();

cardRoutes.use(requireAuth);

cardRoutes.get('/', asyncHandler(VirtualCardController.list));
cardRoutes.post('/', asyncHandler(VirtualCardController.create));
cardRoutes.patch('/:id/limits', asyncHandler(VirtualCardController.updateLimits));
cardRoutes.patch('/:id/status', asyncHandler(VirtualCardController.updateStatus));
cardRoutes.delete('/:id', asyncHandler(VirtualCardController.delete));
