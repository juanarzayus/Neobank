import { ValidationError } from '../errors/DomainError';

/** Número de cuenta: 10 dígitos. Es el dato que se comparte para recibir transferencias. */
export const ACCOUNT_NUMBER_LENGTH = 10;

const ACCOUNT_NUMBER_RE = new RegExp(`^\\d{${ACCOUNT_NUMBER_LENGTH}}$`);

/** Acepta espacios o guiones al escribirlo ("123-456 7890") y devuelve solo los dígitos. */
export function parseAccountNumber(raw: string): string {
  const digits = raw.replace(/[\s-]/g, '');
  if (!ACCOUNT_NUMBER_RE.test(digits)) {
    throw new ValidationError(`El número de cuenta debe tener ${ACCOUNT_NUMBER_LENGTH} dígitos`);
  }
  return digits;
}
