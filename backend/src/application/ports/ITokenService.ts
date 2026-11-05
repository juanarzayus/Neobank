export type TokenType = 'access' | 'refresh';

export interface ITokenService {
  issue(userId: string, type: TokenType): string;
  /** Devuelve el usuario del token si es válido, del tipo esperado y no ha expirado. */
  verify(token: string, expectedType: TokenType): { userId: string } | null;
}
