import type { User } from '../../../domain/entities/User';
import { UserNotFoundError } from '../../../domain/errors/DomainError';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';

export class GetUserProfileUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    return user;
  }
}
