import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { PostgresUserRepository, type UserRecord } from '../../infrastructure/database/repositories/PostgresUserRepository';
import { AppError } from '../../infrastructure/middlewares/errorHandlerMiddleware';
import { hashPassword, verifyPassword } from '../../infrastructure/security/password';
import { signToken, verifyToken } from '../../infrastructure/security/token';

const REFRESH_COOKIE = 'refreshToken';
const EMAIL_RE = /^\S+@\S+\.\S+$/;

const toProfile = (u: UserRecord) => ({
  id: u.id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  kycStatus: u.kycStatus,
  createdAt: u.createdAt,
});

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function issueSession(res: Response, user: UserRecord) {
  res.cookie(REFRESH_COOKIE, signToken(user.id, 'refresh', env.refreshTtlSeconds), {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: env.refreshTtlSeconds * 1000,
  });
  return {
    accessToken: signToken(user.id, 'access', env.accessTtlSeconds),
    user: toProfile(user),
  };
}

export const AuthController = {
  async register(req: Request, res: Response) {
    const { firstName, lastName, email, password } = req.body ?? {};

    if (typeof firstName !== 'string' || !firstName.trim()) throw new AppError(400, 'El nombre es obligatorio');
    if (typeof lastName !== 'string' || !lastName.trim()) throw new AppError(400, 'El apellido es obligatorio');
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) throw new AppError(400, 'Correo no válido');
    if (typeof password !== 'string' || password.length < 8) {
      throw new AppError(400, 'La contraseña debe tener mínimo 8 caracteres');
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await PostgresUserRepository.findByEmail(normalizedEmail)) {
      throw new AppError(409, 'Ya existe una cuenta con ese correo');
    }

    const user = await PostgresUserRepository.create({
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    res.status(201).json(issueSession(res, user));
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new AppError(400, 'Correo y contraseña son obligatorios');
    }

    const user = await PostgresUserRepository.findByEmail(email.trim().toLowerCase());
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new AppError(401, 'Credenciales inválidas');
    }

    res.json(issueSession(res, user));
  },

  async refresh(req: Request, res: Response) {
    const token = readCookie(req, REFRESH_COOKIE);
    const payload = token ? verifyToken(token, 'refresh') : null;
    if (!payload) throw new AppError(401, 'Sesión expirada');

    const user = await PostgresUserRepository.findById(payload.sub);
    if (!user) throw new AppError(401, 'Sesión inválida');

    res.json(issueSession(res, user));
  },

  async logout(_req: Request, res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    res.status(204).end();
  },

  async me(_req: Request, res: Response) {
    const user = await PostgresUserRepository.findById(res.locals.userId);
    if (!user) throw new AppError(404, 'Usuario no encontrado');
    res.json(toProfile(user));
  },
};
