import { VirtualCard } from '../../../domain/entities/VirtualCard';
import { CardNotFoundError } from '../../../domain/errors/DomainError';
import { BusinessCalendar } from '../../../domain/value-objects/BusinessCalendar';
import { MAX_CARD_PURCHASE_AMOUNT, Money } from '../../../domain/value-objects/Money';
import { DEFAULT_PURCHASE_CATEGORY, parseSpendingCategory } from '../../../domain/value-objects/SpendingCategory';
import type { AuthorizePurchaseDto, AuthorizePurchaseResult } from '../../dtos/AuthorizePurchaseDto';
import type { IClock } from '../../ports/IClock';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

/**
 * Autoriza una compra con tarjeta prepago tokenizada:
 * 1) Aplica las reglas de gasto y de fondeo (prepago aislado vs débito de cuenta habilitado).
 * 2) Descuenta primero del saldo prepago de la tarjeta; si falta y autoDebitFromAccount está activo,
 *    descuenta el remanente de la cuenta corriente (CHECKING).
 * 3) Registra el movimiento de consumo de forma atómica.
 */
export class ProcessCardTransactionUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly clock: IClock
  ) { }

  async execute(dto: AuthorizePurchaseDto): Promise<AuthorizePurchaseResult> {
    const amount = Money.positiveAmount(dto.amount, MAX_CARD_PURCHASE_AMOUNT);
    const category = dto.category ? parseSpendingCategory(dto.category) : DEFAULT_PURCHASE_CATEGORY;
    const merchantName = VirtualCard.normalizeMerchantName(dto.merchantName);
    const now = this.clock.now();

    return this.uow.run(async ({ cards, accounts, movements }) => {
      const card = await cards.findOwnedByIdForUpdate(dto.userId, dto.cardId);
      if (!card) throw new CardNotFoundError();

      const periodRolled = card.rollSpendingPeriod(BusinessCalendar.spendingPeriod(now));
      const rejectWith = async (reason: string): Promise<AuthorizePurchaseResult> => {
        if (periodRolled) await cards.save(card);
        return { approved: false, reason };
      };

      const spentToday = card.hasDailyLimit
        ? await movements.sumCardSpendingSince(card.id, BusinessCalendar.startOfDay(now))
        : 0;

      const decision = card.evaluatePurchase({ amount, category, isInternational: dto.isInternational, spentToday });
      if (!decision.approved) return rejectWith(decision.reason);

      const { fromPrepaid, fromAccount } = card.splitPayment(amount);

      const account = await accounts.findCheckingForUpdate(dto.userId);
      if (!account) return rejectWith('No se encontró cuenta principal (CHECKING)');

      if (fromAccount > 0 && !account.canAfford(fromAccount)) {
        return rejectWith(
          `Saldo insuficiente (prepago tarjeta: $${card.prepaidBalance.toFixed(2)}, disponible cuenta: $${account.balance.toFixed(2)})`
        );
      }

      if (fromAccount > 0) {
        account.withdraw(fromAccount);
        await accounts.save(account);
      }

      card.registerPurchase(amount, fromPrepaid);
      await cards.save(card);

      await movements.record({
        accountId: account.id,
        type: 'WITHDRAWAL',
        amount,
        balanceAfter: account.balance,
        description: card.paymentDescription(merchantName),
        category,
        cardId: card.id,
      });

      return { approved: true, amount, merchantName, category, newBalance: account.balance, card };
    });
  }
}
