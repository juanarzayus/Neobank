import type { VirtualCard } from '../../domain/entities/VirtualCard';

/** Solo se actualizan los campos presentes. */
export interface UpdateLimitsDto {
  userId: string;
  cardId: string;
  monthlyLimit?: number;
  dailyLimit?: number | null;
  internationalAllowed?: boolean;
  blockedCategories?: string[];
  autoDebitFromAccount?: boolean;
}

export interface UpdateStatusDto {
  userId: string;
  cardId: string;
  status: string;
}

export interface CardFundingDto {
  userId: string;
  cardId: string;
  amount: number;
}

export interface CardFundingResult {
  card: VirtualCard;
  accountBalance: number;
  amount: number;
}

export interface RevealedCardDetailsDto {
  cardId: string;
  cardToken: string;
  cardNumber: string;
  cvv: string;
  expirationDate: string;
  cardholderName: string;
}
