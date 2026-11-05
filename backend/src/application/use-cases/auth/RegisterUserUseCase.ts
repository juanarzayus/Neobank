import { User } from '../../../domain/entities/User';
import { UsernameAlreadyInUseError } from '../../../domain/errors/DomainError';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { AuthSession, RegisterUserDto } from '../../dtos/AuthDtos';
import type { IPasswordHasher } from '../../ports/IPasswordHasher';
import type { ITokenService } from '../../ports/ITokenService';
import { issueSession } from './issueSession';

export class RegisterUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService
  ) {}

  async execute(dto: RegisterUserDto): Promise<AuthSession> {
    const data = User.validateRegistration(dto);

    if (await this.users.findByUsername(data.username)) throw new UsernameAlreadyInUseError();

    // Si otro registro con el mismo usuario gana la carrera, el repositorio lanza UsernameAlreadyInUseError.
    const user = await this.users.create({ ...data, passwordHash: await this.hasher.hash(dto.password) });
    return issueSession(user, this.tokens);
  }
}
