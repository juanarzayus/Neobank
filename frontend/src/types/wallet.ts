// src/types/wallet.ts
export type CurrencyCode = 'COP' | 'USD' | 'EUR';

export interface Wallet {
    id: string;
    userId: string;
    currency: CurrencyCode;
    balance: number;
    isActive: boolean;
}

export interface ExchangeRate {
    baseCurrency: CurrencyCode;
    targetCurrency: CurrencyCode;
    rate: number;
    timestamp: string; // Crucial para validar transacciones en tiempo real
}