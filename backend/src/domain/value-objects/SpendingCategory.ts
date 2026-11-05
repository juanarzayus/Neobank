import { ValidationError } from '../errors/DomainError';

export const SPENDING_CATEGORIES = [
  'FOOD',
  'SHOPPING',
  'TRANSPORT',
  'UTILITIES',
  'ENTERTAINMENT',
  'HEALTH',
  'EDUCATION',
  'CASH',
  'TRANSFERS',
  'OTHER',
] as const;

export type SpendingCategory = (typeof SPENDING_CATEGORIES)[number];

/** Categoría que se asume para una compra con tarjeta cuando no se indica ninguna. */
export const DEFAULT_PURCHASE_CATEGORY: SpendingCategory = 'SHOPPING';

const isSpendingCategory = (value: string): value is SpendingCategory =>
  (SPENDING_CATEGORIES as readonly string[]).includes(value);

const normalize = (value: string) => value.trim().toUpperCase();

export function parseSpendingCategory(value: string): SpendingCategory {
  const normalized = normalize(value);
  if (!isSpendingCategory(normalized)) throw new ValidationError('Categoría no válida');
  return normalized;
}

/** Valida una lista de categorías (p. ej. las bloqueadas en una tarjeta) y elimina duplicados. */
export function parseSpendingCategoryList(values: readonly string[]): SpendingCategory[] {
  const parsed = values.map((value) => {
    const normalized = normalize(value);
    if (!isSpendingCategory(normalized)) throw new ValidationError('Categorías bloqueadas no válidas');
    return normalized;
  });
  return [...new Set(parsed)];
}
