import {
  AccountNotFoundError,
  AccountNumberNotFoundError,
  ValidationError,
} from '../../../domain/errors/DomainError';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { parseAccountNumber } from '../../../domain/value-objects/AccountNumber';
import { Money } from '../../../domain/value-objects/Money';
import type { ExternalTransferDto, ExternalTransferResult } from '../../dtos/AccountDtos';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

/**
 * Transferencia desde una cuenta propia hacia cualquier cuenta (de otra persona o propia),
 * identificando el destino por su número de cuenta.
 */
export class TransferToAccountNumberUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly users: IUserRepository
  ) {}

  async execute(dto: ExternalTransferDto): Promise<ExternalTransferResult> {
    const amount = Money.positiveAmount(dto.amount);
    const toAccountNumber = parseAccountNumber(dto.toAccountNumber);

    return this.uow.run(async ({ accounts, movements }) => {
      const destination = await accounts.findByNumber(toAccountNumber);
      if (!destination) throw new AccountNumberNotFoundError();
      if (destination.id === dto.fromAccountId) {
        throw new ValidationError('La cuenta origen y destino deben ser distintas');
      }

      // Bloquea ambas cuentas (ordenadas por id para evitar bloqueos cruzados).
      const locked = await accounts.findByIdsForUpdate([dto.fromAccountId, destination.id]);
      const from = locked.find((a) => a.id === dto.fromAccountId);
      const to = locked.find((a) => a.id === destination.id);
      if (!from || !from.belongsTo(dto.userId)) throw new AccountNotFoundError();
      if (!to) throw new AccountNumberNotFoundError();

      from.withdraw(amount);
      to.deposit(amount);
      await accounts.save(from);
      await accounts.save(to);

      const [sender, recipient] = await Promise.all([
        this.users.findById(from.userId),
        this.users.findById(to.userId),
      ]);
      const recipientName = recipient?.publicName ?? 'Titular';
      const senderName = sender?.publicName ?? 'Titular';

      await movements.record({
        accountId: from.id,
        type: 'TRANSFER_OUT',
        amount,
        balanceAfter: from.balance,
        relatedAccountId: to.id,
        description: `Transferencia a ${recipientName} · cta ${to.accountNumber}`,
        category: 'TRANSFERS',
      });
      await movements.record({
        accountId: to.id,
        type: 'TRANSFER_IN',
        amount,
        balanceAfter: to.balance,
        relatedAccountId: from.id,
        description: `Transferencia de ${senderName} · cta ${from.accountNumber}`,
      });

      return {
        from,
        to: { accountNumber: to.accountNumber, accountType: to.type, holderName: recipientName },
        amount,
      };
    });
  }
}
