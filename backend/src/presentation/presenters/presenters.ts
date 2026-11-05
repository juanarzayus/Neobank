import type { AuthorizePurchaseResult } from '../../application/dtos/AuthorizePurchaseDto';
import type { CardFundingResult, RevealedCardDetailsDto } from '../../application/dtos/UpdateLimitsDto';
import type {
  CurrencyWalletValuation,
  ExecuteExchangeResult,
  MultiCurrencyOverviewResult,
} from '../../application/dtos/WalletDtos';
import type { Account } from '../../domain/entities/Account';
import type { AccountMovement } from '../../domain/entities/AccountMovement';
import type { CurrencyExchange } from '../../domain/entities/CurrencyExchange';
import type { CurrencyWallet } from '../../domain/entities/CurrencyWallet';
import type { User } from '../../domain/entities/User';
import type { VirtualCard } from '../../domain/entities/VirtualCard';
import { CURRENCY_CATALOG } from '../../domain/value-objects/Currency';
import type { ConversionResult, InternalCurrencyRate } from '../../domain/value-objects/ExchangeRate';

/**
 * Formato JSON de la API. Se mantiene compatible con el frontend e incorpora
 * los campos de tokenización criptográfica y saldo prepago.
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
    cardToken: c.cardToken,
    last4: c.last4,
    maskedNumber: c.maskedNumber,
    cardholderName: c.cardholderName,
    expirationDate: c.expirationDate,
    prepaidBalance: c.prepaidBalance,
    autoDebitFromAccount: rules.autoDebitFromAccount,
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

export const presentRevealedCard = (details: RevealedCardDetailsDto) => ({
  cardId: details.cardId,
  cardToken: details.cardToken,
  cardNumber: details.cardNumber,
  cvv: details.cvv,
  expirationDate: details.expirationDate,
  cardholderName: details.cardholderName,
});

export const presentCardFunding = (result: CardFundingResult) => ({
  amount: result.amount,
  accountBalance: result.accountBalance,
  prepaidBalance: result.card.prepaidBalance,
  card: presentCard(result.card),
});

export const presentPurchase = (result: AuthorizePurchaseResult) => {
  if (!result.approved) return { approved: false, reason: result.reason };
  return {
    approved: true,
    reason: 'Compra aprobada',
    amount: result.amount,
    merchantName: result.merchantName,
    category: result.category,
    newBalance: result.newBalance,
    prepaidBalance: result.card.prepaidBalance,
    currentSpending: result.card.currentSpending,
    card: presentCard(result.card),
  };
};

export const presentCurrencyWallet = (w: CurrencyWallet) => ({
  id: w.id,
  currency: w.currency,
  name: w.currencyName,
  symbol: w.symbol,
  balance: w.balance,
  createdAt: w.createdAt,
});

export const presentValuedCurrencyWallet = (item: CurrencyWalletValuation) => ({
  ...presentCurrencyWallet(item.wallet),
  copEquivalent: item.copEquivalent,
  midCopRate: item.midCopRate,
});

export const presentInternalRate = (r: InternalCurrencyRate) => {
  const meta = CURRENCY_CATALOG[r.currency];
  return {
    currency: r.currency,
    name: meta.name,
    symbol: meta.symbol,
    copRate: r.copRate,
    buyCopRate: r.buyCopRate,
    sellCopRate: r.sellCopRate,
    spreadPercent: Math.round(r.spreadRate * 10000) / 100,
    updatedAt: r.updatedAt,
  };
};

export const presentExchangeQuote = (c: ConversionResult) => ({
  fromCurrency: c.fromCurrency,
  toCurrency: c.toCurrency,
  fromAmount: c.fromAmount,
  toAmount: c.toAmount,
  midMarketRate: c.midMarketRate,
  effectiveRate: c.effectiveRate,
  inverseRate: c.inverseRate,
  spreadPercent: c.spreadPercent,
  updatedAt: c.updatedAt,
});

export const presentCurrencyExchange = (e: CurrencyExchange) => ({
  id: e.id,
  fromCurrency: e.fromCurrency,
  toCurrency: e.toCurrency,
  fromAmount: e.fromAmount,
  toAmount: e.toAmount,
  rateApplied: e.rateApplied,
  spreadPercent: e.spreadPercent,
  createdAt: e.createdAt,
});

export const presentMultiCurrencyOverview = (o: MultiCurrencyOverviewResult) => ({
  wallets: o.wallets.map(presentValuedCurrencyWallet),
  rates: o.rates.map(presentInternalRate),
  exchanges: o.exchanges.map(presentCurrencyExchange),
  totalForeignInCop: o.totalForeignInCop,
});

export const presentExchangeExecution = (r: ExecuteExchangeResult) => ({
  exchange: presentCurrencyExchange(r.exchange),
  conversion: presentExchangeQuote(r.conversion),
  checkingAccount: r.checkingAccount ? presentAccount(r.checkingAccount) : null,
  wallets: r.wallets.map(presentCurrencyWallet),
});
