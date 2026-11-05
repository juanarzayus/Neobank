import { UnauthorizedError } from '../../../domain/errors/DomainError';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { AuthSession } from '../../dtos/AuthDtos';
import type { ITokenService } from '../../ports/ITokenService';
import { issueSession } from './issueSession';

export class RefreshSessionUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly tokens: ITokenService
  ) {}

  async execute(refreshToken: string | null): Promise<AuthSession> {
    const payload = refreshToken ? this.tokens.verify(refreshToken, 'refresh') : null;
    if (!payload) throw new UnauthorizedError('Sesión expirada');

    const user = await this.users.findById(payload.userId);
    if (!user) throw new UnauthorizedError('Sesión inválida');

    return issueSession(user, this.tokens);
  }
}
