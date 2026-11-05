import { ValidationError } from '../errors/DomainError';
import type { SpendingCategory } from '../value-objects/SpendingCategory';

export type MovementType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'INTEREST';

/** Movimiento del libro de una cuenta. Es inmutable: una vez registrado no cambia. */
export interface AccountMovement {
  readonly id: string;
  readonly accountId: string;
  readonly type: MovementType;
  readonly amount: number;
  readonly balanceAfter: number;
  readonly relatedAccountId: string | null;
  readonly description: string | null;
  readonly category: string | null;
  readonly cardId: string | null;
  readonly createdAt: Date;
}

export interface NewAccountMovement {
  accountId: string;
  type: MovementType;
  amount: number;
  balanceAfter: number;
  relatedAccountId?: string | null;
  description?: string | null;
  category?: SpendingCategory | null;
  cardId?: string | null;
}

const MAX_DESCRIPTION_LENGTH = 200;

export function normalizeMovementDescription(raw: string | undefined): string | null {
  const description = raw?.trim() ?? '';
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new ValidationError('La descripción es demasiado larga');
  }
  return description || null;
}
