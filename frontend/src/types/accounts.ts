import type { SpendingCategoryId } from '@/utils/spendingCategories';

export type AccountType = 'CHECKING' | 'SAVINGS';
export type AccountMovementType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'INTEREST';

export interface Account {
    id: string;
    /** 10 dígitos: se comparte para recibir transferencias. */
    accountNumber: string;
    type: AccountType;
    name: string;
    balance: number;
    /** Tasa efectiva anual (0.04 = 4% EA). */
    annualRate: number;
    lastInterestAt: string | null;
    createdAt: string;
}

/** Datos públicos de una cuenta de destino (sin saldo). */
export interface AccountHolderInfo {
    accountNumber: string;
    accountType: AccountType;
    holderName: string;
}

export interface AccountMovement {
    id: string;
    accountId: string;
    type: AccountMovementType;
    amount: number;
    balanceAfter: number;
    relatedAccountId: string | null;
    description: string | null;
    category?: SpendingCategoryId | string | null;
    createdAt: string;
}
