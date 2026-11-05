import type { VirtualCard } from '../../domain/entities/VirtualCard';
import type { SpendingCategory } from '../../domain/value-objects/SpendingCategory';

export interface AuthorizePurchaseDto {
  userId: string;
  cardId: string;
  amount: number;
  merchantName?: string;
  category?: string;
  isInternational: boolean;
}

/** Un rechazo es un resultado de negocio, no un error. */
export type AuthorizePurchaseResult =
  | { approved: false; reason: string }
  | {
      approved: true;
      amount: number;
      merchantName: string;
      category: SpendingCategory;
      newBalance: number;
      card: VirtualCard;
    };
