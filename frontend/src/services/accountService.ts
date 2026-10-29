import { api } from './api';
import type { Account, AccountMovement } from '@/types/accounts';
import type { SpendingCategoryId } from '@/utils/spendingCategories';

export interface WithdrawOptions {
    category?: SpendingCategoryId;
    description?: string;
}

export const accountService = {
    async list(): Promise<Account[]> {
        return (await api.get<Account[]>('/accounts')).data;
    },
    async createSavings(name?: string): Promise<Account> {
        return (await api.post<Account>('/accounts/savings', { name })).data;
    },
    async deposit(accountId: string, amount: number, description?: string): Promise<Account> {
        return (await api.post<Account>(`/accounts/${accountId}/deposit`, { amount, description })).data;
    },
    async withdraw(accountId: string, amount: number, options?: WithdrawOptions): Promise<Account> {
        return (await api.post<Account>(`/accounts/${accountId}/withdraw`, {
            amount,
            category: options?.category,
            description: options?.description,
        })).data;
    },
    async transfer(fromAccountId: string, toAccountId: string, amount: number) {
        return (await api.post<{ from: Account; to: Account }>('/accounts/transfer', { fromAccountId, toAccountId, amount })).data;
    },
    async creditInterest(accountId: string) {
        return (await api.post<{ account: Account; interest: number }>(`/accounts/${accountId}/interest`)).data;
    },
    async movements(accountId: string): Promise<AccountMovement[]> {
        return (await api.get<AccountMovement[]>(`/accounts/${accountId}/movements`)).data;
    },
};
