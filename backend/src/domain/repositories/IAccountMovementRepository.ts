import type { AccountMovement, NewAccountMovement } from '../entities/AccountMovement';

export interface IAccountMovementRepository {
  record(movement: NewAccountMovement): Promise<AccountMovement>;
  /** Últimos movimientos de una cuenta del usuario (vacío si la cuenta no es suya). */
  findByAccount(userId: string, accountId: string, limit: number): Promise<AccountMovement[]>;
  /** Total pagado con una tarjeta desde un instante dado. */
  sumCardSpendingSince(cardId: string, since: Date): Promise<number>;
}
