import { Router } from 'express';
import { asyncHandler } from '../../infrastructure/middlewares/errorHandlerMiddleware';
import { requireAuth } from '../../infrastructure/middlewares/authMiddleware';
import { AccountController } from '../controllers/AccountController';

export const accountRoutes = Router();

accountRoutes.use(requireAuth);

accountRoutes.get('/', asyncHandler(AccountController.list));
accountRoutes.post('/savings', asyncHandler(AccountController.createSavings));
accountRoutes.post('/transfer', asyncHandler(AccountController.transfer));
accountRoutes.post('/:id/deposit', asyncHandler(AccountController.deposit));
accountRoutes.post('/:id/withdraw', asyncHandler(AccountController.withdraw));
accountRoutes.post('/:id/interest', asyncHandler(AccountController.creditInterest));
accountRoutes.get('/:id/movements', asyncHandler(AccountController.movements));
