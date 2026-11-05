// src/types/cards.ts
import type { SpendingCategoryId } from '@/utils/spendingCategories';

export type CardStatus = 'ACTIVE' | 'FROZEN' | 'CANCELLED';
export type MerchantCategory = SpendingCategoryId;

export interface SpendingRules {
  dailyLimit: number | null;
  monthlyLimit: number | null;
  internationalAllowed: boolean;
  blockedCategories: MerchantCategory[];
  /** Si es true, cuando el saldo prepago no alcance se debita el faltante de la cuenta principal. */
  autoDebitFromAccount: boolean;
}

export interface VirtualCard {
  id: string;
  walletId: string;
  /** Token criptográfico único (ej. "tok_np_8f3a91c4...") */
  cardToken: string;
  /** Últimos 4 dígitos del PAN */
  last4: string;
  /** PAN enmascarado: "**** **** **** 1234" */
  tokenizedPan: string;
  /** Formato MM/YY */
  expirationDate: string;
  /** Solo se recibe temporalmente al solicitar revelar los datos (/cards/:id/reveal) */
  cvv?: string;
  cardholderName?: string;
  /** Saldo prepago cargado en la tarjeta */
  prepaidBalance: number;
  currentSpending?: number;
  status: CardStatus;
  spendingRules: SpendingRules;
  issuedAt: string;
}

export interface RevealedCardDetails {
  cardId: string;
  cardToken: string;
  cardNumber: string;
  cvv: string;
  expirationDate: string;
  cardholderName: string;
}

export interface CreateCardDTO {
  walletId: string;
  initialBalance?: number;
  initialRules?: Partial<SpendingRules>;
}
