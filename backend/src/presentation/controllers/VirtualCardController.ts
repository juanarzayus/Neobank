import type { Request, Response } from 'express';
import type { CreateVirtualCardUseCase } from '../../application/use-cases/cards/CreateVirtualCardUseCase';
import type { DeleteVirtualCardUseCase } from '../../application/use-cases/cards/DeleteVirtualCardUseCase';
import type { ListVirtualCardsUseCase } from '../../application/use-cases/cards/ListVirtualCardsUseCase';
import type { ProcessCardTransactionUseCase } from '../../application/use-cases/cards/ProcessCardTransactionUseCase';
import type { RevealCardDetailsUseCase } from '../../application/use-cases/cards/RevealCardDetailsUseCase';
import type { TopUpVirtualCardUseCase } from '../../application/use-cases/cards/TopUpVirtualCardUseCase';
import type { UnloadVirtualCardUseCase } from '../../application/use-cases/cards/UnloadVirtualCardUseCase';
import type { UpdateCardLimitsUseCase } from '../../application/use-cases/cards/UpdateCardLimitsUseCase';
import type { UpdateCardStatusUseCase } from '../../application/use-cases/cards/UpdateCardStatusUseCase';
import {
  presentCard,
  presentCardFunding,
  presentPurchase,
  presentRevealedCard,
} from '../presenters/presenters';
import {
  bodyOf,
  nullableNumber,
  optionalBoolean,
  optionalNumber,
  optionalString,
  optionalStringArray,
  requireNumber,
  stringOrEmpty,
} from '../validation/requestParsers';

const MESSAGES = {
  monthlyLimit: 'Límite mensual no válido',
  dailyLimit: 'Límite diario no válido',
  international: 'Valor de compras internacionales no válido',
  blockedCategories: 'Categorías bloqueadas no válidas',
  initialBalance: 'Monto de carga inicial no válido',
  autoDebit: 'Opción de débito automático de cuenta no válida',
  fundingAmount: 'El monto debe ser un número mayor a 0',
};

export interface VirtualCardControllerDeps {
  list: ListVirtualCardsUseCase;
  create: CreateVirtualCardUseCase;
  reveal: RevealCardDetailsUseCase;
  topUp: TopUpVirtualCardUseCase;
  unload: UnloadVirtualCardUseCase;
  updateLimits: UpdateCardLimitsUseCase;
  updateStatus: UpdateCardStatusUseCase;
  delete: DeleteVirtualCardUseCase;
  authorize: ProcessCardTransactionUseCase;
}

export class VirtualCardController {
  constructor(private readonly useCases: VirtualCardControllerDeps) {}

  list = async (_req: Request, res: Response) => {
    const cards = await this.useCases.list.execute(res.locals.userId);
    res.json(cards.map(presentCard));
  };

  create = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const card = await this.useCases.create.execute({
      userId: res.locals.userId,
      cardholderName: stringOrEmpty(body.cardholderName),
      monthlyLimit: optionalNumber(body.monthlyLimit, MESSAGES.monthlyLimit) ?? 0,
      dailyLimit: nullableNumber(body.dailyLimit, MESSAGES.dailyLimit) ?? null,
      internationalAllowed: optionalBoolean(body.internationalAllowed, MESSAGES.international) ?? true,
      blockedCategories: optionalStringArray(body.blockedCategories, MESSAGES.blockedCategories) ?? [],
      initialBalance: optionalNumber(body.initialBalance, MESSAGES.initialBalance) ?? 0,
      autoDebitFromAccount: optionalBoolean(body.autoDebitFromAccount, MESSAGES.autoDebit) ?? false,
    });
    res.status(201).json(presentCard(card));
  };

  reveal = async (req: Request, res: Response) => {
    const details = await this.useCases.reveal.execute(res.locals.userId, req.params.id);
    res.json(presentRevealedCard(details));
  };

  topUp = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const result = await this.useCases.topUp.execute({
      userId: res.locals.userId,
      cardId: req.params.id,
      amount: requireNumber(body.amount, MESSAGES.fundingAmount),
    });
    res.json(presentCardFunding(result));
  };

  unload = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const result = await this.useCases.unload.execute({
      userId: res.locals.userId,
      cardId: req.params.id,
      amount: requireNumber(body.amount, MESSAGES.fundingAmount),
    });
    res.json(presentCardFunding(result));
  };

  updateLimits = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const card = await this.useCases.updateLimits.execute({
      userId: res.locals.userId,
      cardId: req.params.id,
      monthlyLimit: optionalNumber(body.monthlyLimit, MESSAGES.monthlyLimit),
      dailyLimit: nullableNumber(body.dailyLimit, MESSAGES.dailyLimit),
      internationalAllowed: optionalBoolean(body.internationalAllowed, MESSAGES.international),
      blockedCategories: optionalStringArray(body.blockedCategories, MESSAGES.blockedCategories),
      autoDebitFromAccount: optionalBoolean(body.autoDebitFromAccount, MESSAGES.autoDebit),
    });
    res.json(presentCard(card));
  };

  updateStatus = async (req: Request, res: Response) => {
    const card = await this.useCases.updateStatus.execute({
      userId: res.locals.userId,
      cardId: req.params.id,
      status: stringOrEmpty(bodyOf(req).status),
    });
    res.json(presentCard(card));
  };

  delete = async (req: Request, res: Response) => {
    await this.useCases.delete.execute(res.locals.userId, req.params.id);
    res.status(204).end();
  };

  /** Siempre responde 200: un rechazo es un resultado de negocio, no un error. */
  authorize = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const result = await this.useCases.authorize.execute({
      userId: res.locals.userId,
      cardId: req.params.id,
      amount: requireNumber(body.amount, 'El monto debe ser un número mayor a 0'),
      merchantName: optionalString(body.merchantName, 'Nombre de comercio no válido'),
      category: optionalString(body.category, 'Categoría no válida'),
      isInternational: optionalBoolean(body.isInternational, 'Valor de compra internacional no válido') ?? false,
    });
    res.json(presentPurchase(result));
  };
}
