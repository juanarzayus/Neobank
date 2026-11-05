import type { ICurrencyExchangeRepository } from '../../../domain/repositories/ICurrencyExchangeRepository';
import type { ICurrencyWalletRepository } from '../../../domain/repositories/ICurrencyWalletRepository';
import { roundMoney } from '../../../domain/value-objects/Money';
import type { MultiCurrencyOverviewResult } from '../../dtos/WalletDtos';
import type { IClock } from '../../ports/IClock';
import type { IExchangeRateProvider } from '../../ports/IExchangeRateProvider';

const RECENT_EXCHANGES_LIMIT = 20;

export class GetMultiCurrencyOverviewUseCase {
  constructor(
    private readonly wallets: ICurrencyWalletRepository,
    private readonly exchanges: ICurrencyExchangeRepository,
    private readonly rates: IExchangeRateProvider,
    private readonly clock: IClock
  ) {}

  async execute(userId: string): Promise<MultiCurrencyOverviewResult> {
    const now = this.clock.now();
    const [userWallets, internalRates, recentExchanges] = await Promise.all([
      this.wallets.findByUser(userId),
      this.rates.listInternalRates(now),
      this.exchanges.findByUser(userId, RECENT_EXCHANGES_LIMIT),
    ]);

    const rateByCurrency = new Map(internalRates.map((r) => [r.currency, r.copRate]));

    const valuedWallets = userWallets.map((wallet) => {
      const midCopRate = rateByCurrency.get(wallet.currency) ?? 0;
      const copEquivalent = roundMoney(wallet.balance * midCopRate);
      return { wallet, copEquivalent, midCopRate };
    });

    const totalForeignInCop = roundMoney(
      valuedWallets.reduce((sum, item) => sum + item.copEquivalent, 0)
    );

    return {
      wallets: valuedWallets,
      rates: internalRates,
      exchanges: recentExchanges,
      totalForeignInCop,
    };
  }
}

