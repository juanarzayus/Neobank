import type { NewVirtualCard, VirtualCard } from '../entities/VirtualCard';

export interface IVirtualCardRepository {
  /** Tarjetas del usuario, de la más reciente a la más antigua. */
  findByUser(userId: string): Promise<VirtualCard[]>;
  /** Igual que findByUser, pero bloquea las filas hasta el fin de la unidad de trabajo. */
  findByUserForUpdate(userId: string): Promise<VirtualCard[]>;
  findOwnedByIdForUpdate(userId: string, cardId: string): Promise<VirtualCard | null>;
  create(data: NewVirtualCard): Promise<VirtualCard>;
  /** Persiste reglas, estado y gasto del periodo. */
  save(card: VirtualCard): Promise<void>;
  /** Devuelve false si la tarjeta no existe o no es del usuario. */
  delete(userId: string, cardId: string): Promise<boolean>;
}
