import type { User } from '../../../domain/entities/User';
import type { AuthSession } from '../../dtos/AuthDtos';
import type { ITokenService } from '../../ports/ITokenService';

export const issueSession = (user: User, tokens: ITokenService): AuthSession => ({
  user,
  accessToken: tokens.issue(user.id, 'access'),
  refreshToken: tokens.issue(user.id, 'refresh'),
});
