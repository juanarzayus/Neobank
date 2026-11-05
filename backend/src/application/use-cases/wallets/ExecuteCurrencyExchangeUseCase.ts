import type { Account } from '../../../domain/entities/Account';
import type { CurrencyWallet } from '../../../domain/entities/CurrencyWallet';
import {
  AccountNotFoundError,
  CurrencyWalletNotFoundError,
  ValidationError,
} from '../../../domain/errors/DomainError';
import {
  formatCurrencyMovementAmount,
  parseCurrencyCode,
  type ForeignCurrencyCode,
} from '../../../domain/value-objects/Currency';
import type { ExecuteExchangeDto, ExecuteExchangeResult } from '../../dtos/WalletDtos';
import type { IClock } from '../../ports/IClock';
import type { IExchangeRateProvider } from '../../ports/IExchangeRateProvider';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

/**
 * Ejecuta de forma atómica una conversión de divisas usando tasas de cambio internas.
 * Soporta:
 *  - Cuenta principal (COP) -> Billetera en divisa (creándola automáticamente si aún no existe)
 *  - Billetera en divisa -> Cuenta principal (COP)
 *  - Billetera en divisa A -> Billetera en divisa B
 */
export class ExecuteCurrencyExchangeUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly rates: IExchangeRateProvider,
    private readonly clock: IClock
  ) {}

  async execute(dto: ExecuteExchangeDto): Promise<ExecuteExchangeResult> {
    const fromCurrency = parseCurrencyCode(dto.fromCurrency);
    const toCurrency = parseCurrencyCode(dto.toCurrency);
    if (fromCurrency === toCurrency) {
      throw new ValidationError('Las monedas de origen y destino deben ser distintas');
    }

    const quote = await this.rates.getQuote(fromCurrency, toCurrency, this.clock.now());
    const conversion = quote.convert(dto.amount);

    return this.uow.run(async ({ accounts, movements, currencyWallets, currencyExchanges }) => {
      let checkingAccount: Account | null = null;

      if (fromCurrency === 'COP' || toCurrency === 'COP') {
        await accounts.createCheckingIfMissing(dto.userId);
        checkingAccount = await accounts.findCheckingForUpdate(dto.userId);
        if (!checkingAccount) throw new AccountNotFoundError();
      }

      // Si destino es divisa extranjera y aún no existe bolsillo, se abre dentro de la transacción.
      if (toCurrency !== 'COP') {
        await currencyWallets.ensureExists(dto.userId, toCurrency as ForeignCurrencyCode);
      }

      // Bloqueo en orden alfabético por código de divisa para evitar deadlocks entre conversiones cruzadas.
      const foreignCurrenciesToLock = [fromCurrency, toCurrency]
        .filter((c): c is ForeignCurrencyCode => c !== 'COP')
        .sort();

      const lockedForeign = new Map<ForeignCurrencyCode, CurrencyWallet>();
      for (const code of foreignCurrenciesToLock) {
        const locked = await currencyWallets.findByUserAndCurrencyForUpdate(dto.userId, code);
        if (locked) lockedForeign.set(code, locked);
      }

      if (fromCurrency === 'COP') {
        checkingAccount!.withdraw(conversion.fromAmount);
        await accounts.save(checkingAccount!);
      } else {
        const fromWallet = lockedForeign.get(fromCurrency);
        if (!fromWallet) throw new CurrencyWalletNotFoundError();
        fromWallet.debit(conversion.fromAmount);
        await currencyWallets.save(fromWallet);
      }

      if (toCurrency === 'COP') {
        checkingAccount!.deposit(conversion.toAmount);
        await accounts.save(checkingAccount!);
      } else {
        const toWallet = lockedForeign.get(toCurrency);
        if (!toWallet) throw new CurrencyWalletNotFoundError();
        toWallet.credit(conversion.toAmount);
        await currencyWallets.save(toWallet);
      }

      if (fromCurrency === 'COP' && checkingAccount) {
        await movements.record({
          accountId: checkingAccount.id,
          type: 'TRANSFER_OUT',
          amount: conversion.fromAmount,
          balanceAfter: checkingAccount.balance,
          description: `Cambio de divisas: COP → ${toCurrency} (+${formatCurrencyMovementAmount(conversion.toAmount, toCurrency)})`,
          category: 'TRANSFERS',
        });
      } else if (toCurrency === 'COP' && checkingAccount) {
        await movements.record({
          accountId: checkingAccount.id,
          type: 'TRANSFER_IN',
          amount: conversion.toAmount,
          balanceAfter: checkingAccount.balance,
          description: `Cambio de divisas: ${fromCurrency} → COP (-${formatCurrencyMovementAmount(conversion.fromAmount, fromCurrency)})`,
          category: 'TRANSFERS',
        });
      }

      const exchange = await currencyExchanges.record({
        userId: dto.userId,
        fromCurrency,
        toCurrency,
        fromAmount: conversion.fromAmount,
        toAmount: conversion.toAmount,
        rateApplied: conversion.effectiveRate,
        spreadPercent: conversion.spreadPercent,
      });

      const updatedWallets = await currencyWallets.findByUser(dto.userId);

      return {
        exchange,
        conversion,
        checkingAccount,
        wallets: updatedWallets,
      };
    });
  }
}
