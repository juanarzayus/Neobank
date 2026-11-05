import type { RequestHandler } from 'express';
import type { ITokenService } from '../../application/ports/ITokenService';
import { UnauthorizedError } from '../../domain/errors/DomainError';

/** Exige un access token válido y deja el id del usuario en res.locals.userId. */
export const createRequireAuth =
  (tokens: ITokenService): RequestHandler =>
  (req, res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const payload = token ? tokens.verify(token, 'access') : null;

    if (!payload) return next(new UnauthorizedError('No autenticado'));

    res.locals.userId = payload.userId;
    next();
  };
