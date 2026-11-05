import { ValidationError } from '../errors/DomainError';

/** Tope para depósitos, retiros y transferencias. */
export const MAX_TRANSACTION_AMOUNT = 1_000_000_000;
/** Tope para una compra con tarjeta. */
export const MAX_CARD_PURCHASE_AMOUNT = 1_000_000;
/** Tope para los límites de gasto de una tarjeta (cabe en NUMERIC(12, 2)). */
export const MAX_SPENDING_LIMIT = 1_000_000_000;

const hasAtMostTwoDecimals = (value: number) =>
  Math.abs(Math.round(value * 100) - value * 100) <= 1e-6;

/** Redondea a centavos para evitar errores de coma flotante (0.1 + 0.2). */
export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export const Money = {
  /** Monto de una operación: mayor a 0, máximo 2 decimales y con tope. */
  positiveAmount(value: number, max: number = MAX_TRANSACTION_AMOUNT): number {
    if (!Number.isFinite(value) || value <= 0) {
      throw new ValidationError('El monto debe ser un número mayor a 0');
    }
    if (!hasAtMostTwoDecimals(value)) throw new ValidationError('El monto admite máximo 2 decimales');
    if (value > max) throw new ValidationError('Monto demasiado alto');
    return roundMoney(value);
  },

  /** Límite de gasto: 0 o más (0 = sin límite), máximo 2 decimales y con tope. */
  spendingLimit(value: number, label: string): number {
    if (!Number.isFinite(value) || value < 0) throw new ValidationError(`${label} no válido`);
    if (!hasAtMostTwoDecimals(value)) throw new ValidationError(`${label}: admite máximo 2 decimales`);
    if (value > MAX_SPENDING_LIMIT) throw new ValidationError(`${label} demasiado alto`);
    return roundMoney(value);
  },
};
