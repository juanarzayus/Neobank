import type { AuthorizePurchaseResult } from '../../application/dtos/AuthorizePurchaseDto';
import type { Account } from '../../domain/entities/Account';
import type { AccountMovement } from '../../domain/entities/AccountMovement';
import type { User } from '../../domain/entities/User';
import type { VirtualCard } from '../../domain/entities/VirtualCard';

/**
 * Formato JSON de la API. Se mantiene idéntico al que ya consume el frontend.
 */

export const presentUser = (u: User) => ({
  id: u.id,
  username: u.username,
  firstName: u.firstName,
  lastName: u.lastName,
  kycStatus: u.kycStatus,
  createdAt: u.createdAt.toISOString(),
});

export const presentAccount = (a: Account) => ({
  id: a.id,
  accountNumber: a.accountNumber,
  type: a.type,
  name: a.name,
  balance: a.balance,
  annualRate: a.annualRate,
  lastInterestAt: a.lastInterestAt,
  createdAt: a.createdAt,
});

export const presentMovement = (m: AccountMovement) => ({
  id: m.id,
  accountId: m.accountId,
  type: m.type,
  amount: m.amount,
  balanceAfter: m.balanceAfter,
  relatedAccountId: m.relatedAccountId,
  description: m.description,
  category: m.category,
  createdAt: m.createdAt,
});

export const presentCard = (c: VirtualCard) => {
  const rules = c.rules;
  return {
    id: c.id,
    maskedNumber: c.maskedNumber,
    cardholderName: c.cardholderName,
    expirationDate: c.expirationDate,
    cvv: c.cvv,
    monthlyLimit: rules.monthlyLimit,
    dailyLimit: rules.dailyLimit,
    currentSpending: c.currentSpending,
    internationalAllowed: rules.internationalAllowed,
    blockedCategories: rules.blockedCategories,
    status: c.status,
    createdAt: c.createdAt,
    spendingRules: rules,
  };
};

export const presentPurchase = (result: AuthorizePurchaseResult) => {
  if (!result.approved) return { approved: false, reason: result.reason };
  return {
    approved: true,
    reason: 'Compra aprobada',
    amount: result.amount,
    merchantName: result.merchantName,
    category: result.category,
    newBalance: result.newBalance,
    currentSpending: result.card.currentSpending,
    card: presentCard(result.card),
  };
};
