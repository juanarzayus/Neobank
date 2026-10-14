import { Router } from 'express';
import { asyncHandler } from '../../infrastructure/middlewares/errorHandlerMiddleware';
import { requireAuth } from '../../infrastructure/middlewares/authMiddleware';
import { AuthController } from '../controllers/AuthController';

export const authRoutes = Router();

authRoutes.post('/register', asyncHandler(AuthController.register));
authRoutes.post('/login', asyncHandler(AuthController.login));
authRoutes.post('/refresh', asyncHandler(AuthController.refresh));
authRoutes.post('/logout', asyncHandler(AuthController.logout));
authRoutes.get('/me', requireAuth, asyncHandler(AuthController.me));
