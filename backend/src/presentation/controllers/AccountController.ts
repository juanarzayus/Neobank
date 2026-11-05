import type { Request, Response } from 'express';
import type { CreateSavingsAccountUseCase } from '../../application/use-cases/accounts/CreateSavingsAccountUseCase';
import type { CreditMonthlyInterestUseCase } from '../../application/use-cases/accounts/CreditMonthlyInterestUseCase';
import type { DepositUseCase } from '../../application/use-cases/accounts/DepositUseCase';
import type { ListAccountMovementsUseCase } from '../../application/use-cases/accounts/ListAccountMovementsUseCase';
import type { ListAccountsUseCase } from '../../application/use-cases/accounts/ListAccountsUseCase';
import type { LookupAccountByNumberUseCase } from '../../application/use-cases/accounts/LookupAccountByNumberUseCase';
import type { TransferBetweenAccountsUseCase } from '../../application/use-cases/accounts/TransferBetweenAccountsUseCase';
import type { TransferToAccountNumberUseCase } from '../../application/use-cases/accounts/TransferToAccountNumberUseCase';
import type { WithdrawUseCase } from '../../application/use-cases/accounts/WithdrawUseCase';
import { presentAccount, presentMovement } from '../presenters/presenters';
import { bodyOf, optionalString, requireNumber, requireString, stringOrUndefined } from '../validation/requestParsers';

const AMOUNT_MESSAGE = 'El monto debe ser un número mayor a 0';

export interface AccountControllerDeps {
  list: ListAccountsUseCase;
  createSavings: CreateSavingsAccountUseCase;
  deposit: DepositUseCase;
  withdraw: WithdrawUseCase;
  transfer: TransferBetweenAccountsUseCase;
  transferExternal: TransferToAccountNumberUseCase;
  lookup: LookupAccountByNumberUseCase;
  creditInterest: CreditMonthlyInterestUseCase;
  movements: ListAccountMovementsUseCase;
}

export class AccountController {
  constructor(private readonly useCases: AccountControllerDeps) {}

  list = async (_req: Request, res: Response) => {
    const accounts = await this.useCases.list.execute(res.locals.userId);
    res.json(accounts.map(presentAccount));
  };

  createSavings = async (req: Request, res: Response) => {
    const account = await this.useCases.createSavings.execute({
      userId: res.locals.userId,
      name: stringOrUndefined(bodyOf(req).name),
    });
    res.status(201).json(presentAccount(account));
  };

  deposit = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const account = await this.useCases.deposit.execute({
      userId: res.locals.userId,
      accountId: req.params.id,
      amount: requireNumber(body.amount, AMOUNT_MESSAGE),
      description: stringOrUndefined(body.description),
    });
    res.json(presentAccount(account));
  };

  withdraw = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const account = await this.useCases.withdraw.execute({
      userId: res.locals.userId,
      accountId: req.params.id,
      amount: requireNumber(body.amount, AMOUNT_MESSAGE),
      category: optionalString(body.category, 'Categoría no válida'),
      description: stringOrUndefined(body.description),
    });
    res.json(presentAccount(account));
  };

  transfer = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const result = await this.useCases.transfer.execute({
      userId: res.locals.userId,
      fromAccountId: requireString(body.fromAccountId, 'Cuentas no válidas'),
      toAccountId: requireString(body.toAccountId, 'Cuentas no válidas'),
      amount: requireNumber(body.amount, AMOUNT_MESSAGE),
    });
    res.json({ from: presentAccount(result.from), to: presentAccount(result.to) });
  };

  /** Transferencia a cualquier cuenta por su número (otra persona o propia). */
  transferExternal = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const result = await this.useCases.transferExternal.execute({
      userId: res.locals.userId,
      fromAccountId: requireString(body.fromAccountId, 'Cuenta de origen no válida'),
      toAccountNumber: requireString(body.toAccountNumber, 'Ingresa el número de cuenta de destino'),
      amount: requireNumber(body.amount, AMOUNT_MESSAGE),
    });
    res.json({ from: presentAccount(result.from), to: result.to, amount: result.amount });
  };

  /** Muestra el titular de una cuenta para confirmar antes de transferir. */
  lookup = async (req: Request, res: Response) => {
    res.json(await this.useCases.lookup.execute(req.params.accountNumber));
  };

  creditInterest = async (req: Request, res: Response) => {
    const result = await this.useCases.creditInterest.execute(res.locals.userId, req.params.id);
    res.json({ account: presentAccount(result.account), interest: result.interest });
  };

  movements = async (req: Request, res: Response) => {
    const movements = await this.useCases.movements.execute({
      userId: res.locals.userId,
      accountId: req.params.id,
      limit: Number(req.query.limit) || undefined,
    });
    res.json(movements.map(presentMovement));
  };
}
