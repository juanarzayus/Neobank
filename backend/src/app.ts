import express from 'express';
import { corsMiddleware } from './infrastructure/middlewares/corsMiddleware';
import { errorHandler, notFoundHandler } from './infrastructure/middlewares/errorHandlerMiddleware';
import { apiRouter } from './presentation/routes';

export const app = express();

app.use(corsMiddleware);
app.use(express.json());

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
