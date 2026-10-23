// src/types/cards.ts
export type CardStatus = 'ACTIVE' | 'FROZEN' | 'CANCELLED';
export type MerchantCategory = 'GAMBLING' | 'ENTERTAINMENT' | 'RESTAURANTS' | 'GROCERIES' | 'TRAVEL';

export interface SpendingRules {
    dailyLimit: number | null;
    monthlyLimit: number | null;
    internationalAllowed: boolean;
    blockedCategories: MerchantCategory[];
}

export interface VirtualCard {
    id: string;
    walletId: string;
    tokenizedPan: string; // Ej: "**** **** **** 1234"
    expirationDate: string; // Formato MM/YY
    cvv?: string; // Solo se recibe al solicitar revelar los datos (challenge)
    cardholderName?: string;
    status: CardStatus;
    spendingRules: SpendingRules;
    issuedAt: string;
}

export interface CreateCardDTO {
    walletId: string;
    initialRules?: Partial<SpendingRules>;
}