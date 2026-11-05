import { User } from '../../../domain/entities/User';
import { UnauthorizedError } from '../../../domain/errors/DomainError';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { AuthSession, LoginUserDto } from '../../dtos/AuthDtos';
import type { IPasswordHasher } from '../../ports/IPasswordHasher';
import type { ITokenService } from '../../ports/ITokenService';
import { issueSession } from './issueSession';

export class LoginUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService
  ) {}

  async execute(dto: LoginUserDto): Promise<AuthSession> {
    const user = await this.users.findByUsername(User.normalizeUsername(dto.username));
    // Mismo mensaje si el usuario no existe o la contraseña falla: no revela qué usuarios existen.
    if (!user || !(await this.hasher.verify(dto.password, user.passwordHash))) {
      throw new UnauthorizedError('Usuario o contraseña incorrectos');
    }
    return issueSession(user, this.tokens);
  }
}
