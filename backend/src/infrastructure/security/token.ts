import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env';

export type TokenType = 'access' | 'refresh';

interface TokenPayload {
  sub: string;
  type: TokenType;
  iat: number;
  exp: number;
}

const b64 = (input: Buffer | string) => Buffer.from(input).toString('base64url');
const sign = (data: string) => createHmac('sha256', env.jwtSecret).update(data).digest();

export function signToken(userId: string, type: TokenType, ttlSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64(JSON.stringify({ sub: userId, type, iat: now, exp: now + ttlSeconds }));
  return `${header}.${payload}.${b64(sign(`${header}.${payload}`))}`;
}

export function verifyToken(token: string, expectedType: TokenType): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  const expected = sign(`${header}.${payload}`);
  const received = Buffer.from(signature, 'base64url');
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as TokenPayload;
    if (data.type !== expectedType || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}
