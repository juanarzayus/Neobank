import { type RequestHandler, Router } from 'express';
import type { CurrencyWalletController } from '../controllers/CurrencyWalletController';
import { asyncHandler } from '../middlewares/errorHandlerMiddleware';

export const createWalletRoutes = (
  controller: CurrencyWalletController,
  requireAuth: RequestHandler
): Router => {
  const router = Router();
  router.use(requireAuth);
  router.get('/', asyncHandler(controller.overview));
  router.get('/rates', asyncHandler(controller.rates));
  router.get('/exchanges', asyncHandler(controller.exchanges));
  router.get('/quote', asyncHandler(controller.quote));
  router.post('/', asyncHandler(controller.open));
  router.post('/exchange', asyncHandler(controller.exchange));
  router.delete('/:currency', asyncHandler(controller.close));
  return router;
};

