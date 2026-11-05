import type { CurrencyWallet } from '../../../domain/entities/CurrencyWallet';
import { CurrencyWalletAlreadyExistsError } from '../../../domain/errors/DomainError';
import type { ICurrencyWalletRepository } from '../../../domain/repositories/ICurrencyWalletRepository';
import { parseForeignCurrencyCode } from '../../../domain/value-objects/Currency';
import type { OpenCurrencyWalletDto } from '../../dtos/WalletDtos';

export class OpenCurrencyWalletUseCase {
  constructor(private readonly wallets: ICurrencyWalletRepository) {}

  async execute(dto: OpenCurrencyWalletDto): Promise<CurrencyWallet> {
    const currency = parseForeignCurrencyCode(dto.currency);
    const existing = await this.wallets.findByUserAndCurrency(dto.userId, currency);
    if (existing) throw new CurrencyWalletAlreadyExistsError();

    return this.wallets.create(dto.userId, currency);
  }
}

