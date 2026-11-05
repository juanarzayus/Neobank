import type { Account } from '../../domain/entities/Account';

export interface CreateSavingsAccountDto {
  userId: string;
  name?: string;
}

export interface DepositDto {
  userId: string;
  accountId: string;
  amount: number;
  description?: string;
}

export interface WithdrawDto {
  userId: string;
  accountId: string;
  amount: number;
  category?: string;
  description?: string;
}

export interface TransferDto {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

export interface TransferResult {
  from: Account;
  to: Account;
}

/** Datos públicos de una cuenta ajena: nunca su saldo ni su id interno. */
export interface AccountHolderInfo {
  accountNumber: string;
  accountType: Account['type'];
  holderName: string;
}

export interface ExternalTransferDto {
  userId: string;
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
}

export interface ExternalTransferResult {
  from: Account;
  to: AccountHolderInfo;
  amount: number;
}

export interface CreditInterestResult {
  account: Account;
  interest: number;
}

export interface ListMovementsDto {
  userId: string;
  accountId: string;
  limit?: number;
}
