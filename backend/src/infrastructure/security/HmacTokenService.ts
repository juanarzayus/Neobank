import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ITokenService, TokenType } from '../../application/ports/ITokenService';

interface TokenPayload {
  sub: string;
  type: TokenType;
  iat: number;
  exp: number;
}

const b64 = (input: Buffer | string) => Buffer.from(input).toString('base64url');

/** JWT firmado con HMAC-SHA256. */
export class HmacTokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly ttlSeconds: Record<TokenType, number>
  ) {}

  private sign(data: string): Buffer {
    return createHmac('sha256', this.secret).update(data).digest();
  }

  issue(userId: string, type: TokenType): string {
    const now = Math.floor(Date.now() / 1000);
    const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = b64(JSON.stringify({ sub: userId, type, iat: now, exp: now + this.ttlSeconds[type] }));
    return `${header}.${payload}.${b64(this.sign(`${header}.${payload}`))}`;
  }

  verify(token: string, expectedType: TokenType): { userId: string } | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expected = this.sign(`${header}.${payload}`);
    const received = Buffer.from(signature, 'base64url');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

    try {
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as TokenPayload;
      if (data.type !== expectedType || data.exp < Math.floor(Date.now() / 1000)) return null;
      return { userId: data.sub };
    } catch {
      return null;
    }
  }
}
