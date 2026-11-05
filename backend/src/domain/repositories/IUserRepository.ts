import type { NewUser, User } from '../entities/User';

export interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  /** Lanza UsernameAlreadyInUseError si el usuario ya existe. */
  create(data: NewUser): Promise<User>;
}
