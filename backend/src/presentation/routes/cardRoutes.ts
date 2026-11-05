import { type RequestHandler, Router } from 'express';
import type { VirtualCardController } from '../controllers/VirtualCardController';
import { asyncHandler } from '../middlewares/errorHandlerMiddleware';

export const createCardRoutes = (controller: VirtualCardController, requireAuth: RequestHandler): Router => {
  const router = Router();
  router.use(requireAuth);
  router.get('/', asyncHandler(controller.list));
  router.post('/', asyncHandler(controller.create));
  router.post('/:id/reveal', asyncHandler(controller.reveal));
  router.post('/:id/topup', asyncHandler(controller.topUp));
  router.post('/:id/unload', asyncHandler(controller.unload));
  router.patch('/:id/limits', asyncHandler(controller.updateLimits));
  router.patch('/:id/status', asyncHandler(controller.updateStatus));
  router.post('/:id/authorize', asyncHandler(controller.authorize));
  router.delete('/:id', asyncHandler(controller.delete));
  return router;
};
