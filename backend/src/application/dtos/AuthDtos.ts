import type { User } from '../../domain/entities/User';

export interface RegisterUserDto {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}

export interface LoginUserDto {
  username: string;
  password: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}
