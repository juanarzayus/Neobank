/**
 * Errores del dominio. No saben nada de HTTP: el adaptador de entrada
 * (presentation) decide qué código de estado corresponde a cada tipo.
 */
export type DomainErrorKind = 'VALIDATION' | 'BUSINESS_RULE' | 'NOT_FOUND' | 'CONFLICT' | 'UNAUTHORIZED';

export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Datos de entrada con formato o valor inválido. */
export class ValidationError extends DomainError {
  readonly kind = 'VALIDATION' as const;
}

/** La operación es válida en forma, pero una regla de negocio la impide. */
export class BusinessRuleError extends DomainError {
  readonly kind = 'BUSINESS_RULE' as const;
}

export class NotFoundError extends DomainError {
  readonly kind = 'NOT_FOUND' as const;
}

export class ConflictError extends DomainError {
  readonly kind = 'CONFLICT' as const;
}

export class UnauthorizedError extends DomainError {
  readonly kind = 'UNAUTHORIZED' as const;
}

export class AccountNotFoundError extends NotFoundError {
  constructor() {
    super('Cuenta no encontrada');
  }
}

export class CardNotFoundError extends NotFoundError {
  constructor() {
    super('Tarjeta no encontrada');
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('Usuario no encontrado');
  }
}

export class UsernameAlreadyInUseError extends ConflictError {
  constructor() {
    super('Ese nombre de usuario ya está en uso');
  }
}

export class AccountNumberNotFoundError extends NotFoundError {
  constructor() {
    super('No existe una cuenta con ese número');
  }
}

export class CurrencyWalletNotFoundError extends NotFoundError {
  constructor() {
    super('Billetera en divisa no encontrada');
  }
}

export class CurrencyWalletAlreadyExistsError extends ConflictError {
  constructor() {
    super('Ya tienes una billetera activa en esta moneda');
  }
}

export class ExchangeRateNotAvailableError extends BusinessRuleError {
  constructor() {
    super('Tasa de cambio no disponible en este momento, intenta de nuevo más tarde');
  }
}
