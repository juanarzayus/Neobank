import { ValidationError } from '../errors/DomainError';

export interface UserProps {
  id: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  kycStatus: string;
  createdAt: Date;
}

export type NewUser = Pick<UserProps, 'username' | 'passwordHash' | 'firstName' | 'lastName'>;

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}

export interface RegistrationData {
  username: string;
  firstName: string;
  lastName: string;
}

const USERNAME_MIN = 3;
const USERNAME_MAX = 30;
const USERNAME_RE = /^[a-z0-9._-]+$/;
const MAX_NAME_LENGTH = 100;
export const MIN_PASSWORD_LENGTH = 8;

export class User {
  readonly id: string;
  readonly username: string;
  readonly passwordHash: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly kycStatus: string;
  readonly createdAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.username = props.username;
    this.passwordHash = props.passwordHash;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.kycStatus = props.kycStatus;
    this.createdAt = props.createdAt;
  }

  /** Nombre que ven otras personas (p. ej. al transferirte): "Juan P." */
  get publicName(): string {
    const initial = this.lastName.trim().charAt(0).toUpperCase();
    return initial ? `${this.firstName} ${initial}.` : this.firstName;
  }

  /** Los usuarios no distinguen mayúsculas: "JuanP" y "juanp" son el mismo. */
  static normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }

  static validateUsername(raw: string): string {
    const username = User.normalizeUsername(raw);
    if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
      throw new ValidationError(`El usuario debe tener entre ${USERNAME_MIN} y ${USERNAME_MAX} caracteres`);
    }
    if (!USERNAME_RE.test(username)) {
      throw new ValidationError('El usuario solo puede tener letras, números, punto (.), guion (-) y guion bajo (_)');
    }
    return username;
  }

  /** Reglas de registro: devuelve los datos normalizados o lanza ValidationError. */
  static validateRegistration(input: RegistrationInput): RegistrationData {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    if (!firstName) throw new ValidationError('El nombre es obligatorio');
    if (!lastName) throw new ValidationError('El apellido es obligatorio');
    if (firstName.length > MAX_NAME_LENGTH || lastName.length > MAX_NAME_LENGTH) {
      throw new ValidationError('El nombre o apellido es demasiado largo');
    }
    const username = User.validateUsername(input.username);
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`La contraseña debe tener mínimo ${MIN_PASSWORD_LENGTH} caracteres`);
    }

    return { username, firstName, lastName };
  }
}
