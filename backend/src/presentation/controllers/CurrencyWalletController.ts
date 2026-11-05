import type { Request, Response } from 'express';
import type { CloseCurrencyWalletUseCase } from '../../application/use-cases/wallets/CloseCurrencyWalletUseCase';
import type { ExecuteCurrencyExchangeUseCase } from '../../application/use-cases/wallets/ExecuteCurrencyExchangeUseCase';
import type { GetMultiCurrencyOverviewUseCase } from '../../application/use-cases/wallets/GetMultiCurrencyOverviewUseCase';
import type { ListCurrencyExchangesUseCase } from '../../application/use-cases/wallets/ListCurrencyExchangesUseCase';
import type { ListExchangeRatesUseCase } from '../../application/use-cases/wallets/ListExchangeRatesUseCase';
import type { OpenCurrencyWalletUseCase } from '../../application/use-cases/wallets/OpenCurrencyWalletUseCase';
import type { PreviewCurrencyExchangeUseCase } from '../../application/use-cases/wallets/PreviewCurrencyExchangeUseCase';
import { ValidationError } from '../../domain/errors/DomainError';
import {
  presentCurrencyExchange,
  presentCurrencyWallet,
  presentExchangeExecution,
  presentExchangeQuote,
  presentInternalRate,
  presentMultiCurrencyOverview,
} from '../presenters/presenters';
import { bodyOf, requireNumber, requireString, stringOrEmpty } from '../validation/requestParsers';

const AMOUNT_MESSAGE = 'El monto debe ser un número mayor a 0';

export interface CurrencyWalletControllerDeps {
  overview: GetMultiCurrencyOverviewUseCase;
  rates: ListExchangeRatesUseCase;
  exchanges: ListCurrencyExchangesUseCase;
  open: OpenCurrencyWalletUseCase;
  close: CloseCurrencyWalletUseCase;
  quote: PreviewCurrencyExchangeUseCase;
  exchange: ExecuteCurrencyExchangeUseCase;
}

export class CurrencyWalletController {
  constructor(private readonly useCases: CurrencyWalletControllerDeps) {}

  overview = async (_req: Request, res: Response) => {
    const result = await this.useCases.overview.execute(res.locals.userId);
    res.json(presentMultiCurrencyOverview(result));
  };

  rates = async (_req: Request, res: Response) => {
    const rates = await this.useCases.rates.execute();
    res.json(rates.map(presentInternalRate));
  };

  exchanges = async (req: Request, res: Response) => {
    const list = await this.useCases.exchanges.execute(
      res.locals.userId,
      Number(req.query.limit) || undefined
    );
    res.json(list.map(presentCurrencyExchange));
  };

  open = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const wallet = await this.useCases.open.execute({
      userId: res.locals.userId,
      currency: requireString(body.currency, 'Selecciona una moneda válida'),
    });
    res.status(201).json(presentCurrencyWallet(wallet));
  };

  close = async (req: Request, res: Response) => {
    await this.useCases.close.execute({
      userId: res.locals.userId,
      currency: req.params.currency,
    });
    res.status(204).send();
  };

  quote = async (req: Request, res: Response) => {
    const rawAmount = Number(req.query.amount);
    if (!Number.isFinite(rawAmount)) {
      throw new ValidationError(AMOUNT_MESSAGE);
    }
    const conversion = await this.useCases.quote.execute({
      fromCurrency: stringOrEmpty(req.query.from),
      toCurrency: stringOrEmpty(req.query.to),
      amount: rawAmount,
    });
    res.json(presentExchangeQuote(conversion));
  };

  exchange = async (req: Request, res: Response) => {
    const body = bodyOf(req);
    const result = await this.useCases.exchange.execute({
      userId: res.locals.userId,
      fromCurrency: requireString(body.fromCurrency, 'Selecciona la moneda de origen'),
      toCurrency: requireString(body.toCurrency, 'Selecciona la moneda de destino'),
      amount: requireNumber(body.amount, AMOUNT_MESSAGE),
    });
    res.status(201).json(presentExchangeExecution(result));
  };
}

