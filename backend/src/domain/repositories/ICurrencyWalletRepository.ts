import type { CurrencyWallet } from '../entities/CurrencyWallet';
import type { ForeignCurrencyCode } from '../value-objects/Currency';

export interface ICurrencyWalletRepository {
  findByUser(userId: string): Promise<CurrencyWallet[]>;
  findByUserAndCurrency(userId: string, currency: ForeignCurrencyCode): Promise<CurrencyWallet | null>;
  findByUserAndCurrencyForUpdate(
    userId: string,
    currency: ForeignCurrencyCode
  ): Promise<CurrencyWallet | null>;
  create(userId: string, currency: ForeignCurrencyCode): Promise<CurrencyWallet>;
  ensureExists(userId: string, currency: ForeignCurrencyCode): Promise<void>;
  save(wallet: CurrencyWallet): Promise<void>;
  delete(id: string): Promise<void>;
}
