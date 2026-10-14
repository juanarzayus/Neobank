// src/types/transactions.ts
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'CARD_PAYMENT' | 'CURRENCY_EXCHANGE';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED_BY_RULE';

export type CurrencyCode = 'USD' | 'EUR' | 'COP' | (string & {});

export type MerchantCategory =
    | 'RETAIL'
    | 'FOOD_AND_DINING'
    | 'ENTERTAINMENT'
    | 'TRAVEL'
    | 'HEALTH_AND_SERVICES'
    | 'UTILITIES'
    | 'OTHER';

export interface Transaction {
    id: string;
    walletId: string;
    cardId?: string; // Opcional, presente si fue un pago con tarjeta
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    currency: CurrencyCode;
    exchangeRateApplied?: number; // Si fue una transacción multimoneda
    merchantName?: string;
    merchantCategory?: MerchantCategory;
    rejectionReason?: string; // Se llena si el status es 'REJECTED_BY_RULE'
    referenceCode: string;
    createdAt: string;
}