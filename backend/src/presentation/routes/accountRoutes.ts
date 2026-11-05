import { type RequestHandler, Router } from 'express';
import type { AccountController } from '../controllers/AccountController';
import { asyncHandler } from '../middlewares/errorHandlerMiddleware';

export const createAccountRoutes = (controller: AccountController, requireAuth: RequestHandler): Router => {
  const router = Router();
  router.use(requireAuth);
  router.get('/', asyncHandler(controller.list));
  router.post('/savings', asyncHandler(controller.createSavings));
  router.post('/transfer', asyncHandler(controller.transfer));
  router.post('/transfer/external', asyncHandler(controller.transferExternal));
  router.get('/lookup/:accountNumber', asyncHandler(controller.lookup));
  router.post('/:id/deposit', asyncHandler(controller.deposit));
  router.post('/:id/withdraw', asyncHandler(controller.withdraw));
  router.post('/:id/interest', asyncHandler(controller.creditInterest));
  router.get('/:id/movements', asyncHandler(controller.movements));
  return router;
};
