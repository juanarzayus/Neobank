import { VirtualCard } from '../../../domain/entities/VirtualCard';
import { BusinessRuleError } from '../../../domain/errors/DomainError';
import { BusinessCalendar } from '../../../domain/value-objects/BusinessCalendar';
import { Money } from '../../../domain/value-objects/Money';
import type { CreateCardDto } from '../../dtos/CreateCardDto';
import type { ICardDetailsGenerator } from '../../ports/ICardDetailsGenerator';
import type { ICardTokenVault } from '../../ports/ICardTokenVault';
import type { IClock } from '../../ports/IClock';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

export class CreateVirtualCardUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly generator: ICardDetailsGenerator,
    private readonly vault: ICardTokenVault,
    private readonly clock: IClock
  ) { }

  async execute(dto: CreateCardDto): Promise<VirtualCard> {
    const cardholderName = VirtualCard.normalizeCardholderName(dto.cardholderName);
    const rules = VirtualCard.createRules(dto);
    const initialBalance =
      dto.initialBalance !== undefined && dto.initialBalance > 0
        ? Money.positiveAmount(dto.initialBalance)
        : 0;
    const now = this.clock.now();

    const generated = this.generator.generate(now);
    const tokenized = this.vault.tokenize({
      cardNumber: generated.cardNumber,
      cvv: generated.cvv,
    });

    return this.uow.run(async ({ cards, accounts, movements }) => {
      let accountToDebit = null;
      if (initialBalance > 0) {
        accountToDebit = await accounts.findCheckingForUpdate(dto.userId);
        if (!accountToDebit) {
          throw new BusinessRuleError('No se encontró cuenta principal (CHECKING) para fondear la tarjeta');
        }
        accountToDebit.withdraw(initialBalance);
        await accounts.save(accountToDebit);
      }

      const created = await cards.create({
        userId: dto.userId,
        cardToken: tokenized.cardToken,
        last4: generated.last4,
        encryptedPan: tokenized.encryptedPan,
        encryptedCvv: tokenized.encryptedCvv,
        cardholderName,
        expirationDate: generated.expirationDate,
        prepaidBalance: initialBalance,
        rules,
        spendingPeriod: BusinessCalendar.spendingPeriod(now),
      });

      if (initialBalance > 0 && accountToDebit) {
        await movements.record({
          accountId: accountToDebit.id,
          type: 'TRANSFER_OUT',
          amount: initialBalance,
          balanceAfter: accountToDebit.balance,
          description: created.topUpDescription(),
          category: 'TRANSFERS',
        });
      }

      return created;
    });
  }
}
