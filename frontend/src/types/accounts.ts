export type AccountType = 'CHECKING' | 'SAVINGS';
export type AccountMovementType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'INTEREST';

export interface Account {
    id: string;
    type: AccountType;
    name: string;
    balance: number;
    /** Tasa efectiva anual (0.04 = 4% EA). */
    annualRate: number;
    lastInterestAt: string | null;
    createdAt: string;
}

export interface AccountMovement {
    id: string;
    accountId: string;
    type: AccountMovementType;
    amount: number;
    balanceAfter: number;
    relatedAccountId: string | null;
    description: string | null;
    createdAt: string;
}
