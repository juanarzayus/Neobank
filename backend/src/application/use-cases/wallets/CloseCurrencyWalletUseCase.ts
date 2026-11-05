import { CurrencyWalletNotFoundError } from '../../../domain/errors/DomainError';
import { parseForeignCurrencyCode } from '../../../domain/value-objects/Currency';
import type { CloseCurrencyWalletDto } from '../../dtos/WalletDtos';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

export class CloseCurrencyWalletUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  async execute(dto: CloseCurrencyWalletDto): Promise<void> {
    const currency = parseForeignCurrencyCode(dto.currency);

    await this.uow.run(async ({ currencyWallets }) => {
      const wallet = await currencyWallets.findByUserAndCurrencyForUpdate(dto.userId, currency);
      if (!wallet) throw new CurrencyWalletNotFoundError();

      wallet.ensureZeroBalanceForClose();
      await currencyWallets.delete(wallet.id);
    });
  }
}

