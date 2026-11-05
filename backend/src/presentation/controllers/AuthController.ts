import type { CookieOptions, Request, Response } from 'express';
import type { AuthSession } from '../../application/dtos/AuthDtos';
import type { GetUserProfileUseCase } from '../../application/use-cases/auth/GetUserProfileUseCase';
import type { LoginUserUseCase } from '../../application/use-cases/auth/LoginUserUseCase';
import type { RefreshSessionUseCase } from '../../application/use-cases/auth/RefreshSessionUseCase';
import type { RegisterUserUseCase } from '../../application/use-cases/auth/RegisterUserUseCase';
import { presentUser } from '../presenters/presenters';
import { bodyOf, requireString, stringOrEmpty } from '../validation/requestParsers';

const REFRESH_COOKIE = 'refreshToken';

export interface AuthControllerDeps {
  register: RegisterUserUseCase;
  login: LoginUserUseCase;
  refresh: RefreshSessionUseCase;
  getProfile: GetUserProfileUseCase;
}

export interface AuthCookieOptions {
  secure: boolean;
  refreshTtlSeconds: number;
}

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export class AuthController {
  constructor(
    private readonly useCases: AuthControllerDeps,
    private readonly cookie: AuthCookieOptions
  ) {}

  private get cookieOptions(): CookieOptions {
    return { httpOnly: true, secure: this.cookie.secure, sameSite: 'lax', path: '/api/v1/auth' };
  }

  /** El refresh token viaja en cookie HttpOnly; el access token en el cuerpo. */
  private sendSession(res: Response, session: AuthSession, status = 200) {
    res.cookie(REFRESH_COOKIE, session.refreshToken, {
      ...this.cookieOptions,
      maxAge: this.cookie.refreshTtlSeconds * 1000,
    });
    res.status(status).json({ accessToken: session.accessToken, user: presentUser(session.user) });
  }

  register = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const session = await this.useCases.register.execute({
      firstName: stringOrEmpty(body.firstName),
      lastName: stringOrEmpty(body.lastName),
      username: stringOrEmpty(body.username),
      password: stringOrEmpty(body.password),
    });
    this.sendSession(res, session, 201);
  };

  login = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const message = 'Usuario y contraseña son obligatorios';
    const session = await this.useCases.login.execute({
      username: requireString(body.username, message),
      password: requireString(body.password, message),
    });
    this.sendSession(res, session);
  };

  refresh = async (req: Request, res: Response) => {
    const session = await this.useCases.refresh.execute(readCookie(req, REFRESH_COOKIE));
    this.sendSession(res, session);
  };

  logout = async (_req: Request, res: Response) => {
    res.cookie(REFRESH_COOKIE, '', { ...this.cookieOptions, maxAge: 0, expires: new Date(0) });
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions);
    res.status(204).end();
  };

  me = async (_req: Request, res: Response) => {
    const user = await this.useCases.getProfile.execute(res.locals.userId);
    res.json(presentUser(user));
  };
}
