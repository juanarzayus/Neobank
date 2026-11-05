/**
 * Raíz de composición: el ÚNICO lugar que conoce a la vez los adaptadores concretos
 * (Postgres, scrypt, HMAC, AES-GCM Token Vault, Express) y los casos de uso. Aquí se conectan los puertos.
 */
import { CreateSavingsAccountUseCase } from '../application/use-cases/accounts/CreateSavingsAccountUseCase';
import { CreditMonthlyInterestUseCase } from '../application/use-cases/accounts/CreditMonthlyInterestUseCase';
import { DepositUseCase } from '../application/use-cases/accounts/DepositUseCase';
import { ListAccountMovementsUseCase } from '../application/use-cases/accounts/ListAccountMovementsUseCase';
import { ListAccountsUseCase } from '../application/use-cases/accounts/ListAccountsUseCase';
import { LookupAccountByNumberUseCase } from '../application/use-cases/accounts/LookupAccountByNumberUseCase';
import { TransferBetweenAccountsUseCase } from '../application/use-cases/accounts/TransferBetweenAccountsUseCase';
import { TransferToAccountNumberUseCase } from '../application/use-cases/accounts/TransferToAccountNumberUseCase';
import { WithdrawUseCase } from '../application/use-cases/accounts/WithdrawUseCase';
import { GetUserProfileUseCase } from '../application/use-cases/auth/GetUserProfileUseCase';
import { LoginUserUseCase } from '../application/use-cases/auth/LoginUserUseCase';
import { RefreshSessionUseCase } from '../application/use-cases/auth/RefreshSessionUseCase';
import { RegisterUserUseCase } from '../application/use-cases/auth/RegisterUserUseCase';
import { CreateVirtualCardUseCase } from '../application/use-cases/cards/CreateVirtualCardUseCase';
import { DeleteVirtualCardUseCase } from '../application/use-cases/cards/DeleteVirtualCardUseCase';
import { ListVirtualCardsUseCase } from '../application/use-cases/cards/ListVirtualCardsUseCase';
import { ProcessCardTransactionUseCase } from '../application/use-cases/cards/ProcessCardTransactionUseCase';
import { RevealCardDetailsUseCase } from '../application/use-cases/cards/RevealCardDetailsUseCase';
import { TopUpVirtualCardUseCase } from '../application/use-cases/cards/TopUpVirtualCardUseCase';
import { UnloadVirtualCardUseCase } from '../application/use-cases/cards/UnloadVirtualCardUseCase';
import { UpdateCardLimitsUseCase } from '../application/use-cases/cards/UpdateCardLimitsUseCase';
import { UpdateCardStatusUseCase } from '../application/use-cases/cards/UpdateCardStatusUseCase';
import { CheckDatabaseHealthUseCase } from '../application/use-cases/health/CheckDatabaseHealthUseCase';
import { CloseCurrencyWalletUseCase } from '../application/use-cases/wallets/CloseCurrencyWalletUseCase';
import { ExecuteCurrencyExchangeUseCase } from '../application/use-cases/wallets/ExecuteCurrencyExchangeUseCase';
import { GetMultiCurrencyOverviewUseCase } from '../application/use-cases/wallets/GetMultiCurrencyOverviewUseCase';
import { ListCurrencyExchangesUseCase } from '../application/use-cases/wallets/ListCurrencyExchangesUseCase';
import { ListExchangeRatesUseCase } from '../application/use-cases/wallets/ListExchangeRatesUseCase';
import { OpenCurrencyWalletUseCase } from '../application/use-cases/wallets/OpenCurrencyWalletUseCase';
import { PreviewCurrencyExchangeUseCase } from '../application/use-cases/wallets/PreviewCurrencyExchangeUseCase';
import { env } from '../infrastructure/config/env';
import { PostgresHealthCheck } from '../infrastructure/database/PostgresHealthCheck';
import { pool } from '../infrastructure/database/PostgresPool';
import { PostgresUnitOfWork } from '../infrastructure/database/PostgresUnitOfWork';
import { PostgresAccountMovementRepository } from '../infrastructure/database/repositories/PostgresAccountMovementRepository';
import { PostgresAccountRepository } from '../infrastructure/database/repositories/PostgresAccountRepository';
import { PostgresCurrencyExchangeRepository } from '../infrastructure/database/repositories/PostgresCurrencyExchangeRepository';
import { PostgresCurrencyWalletRepository } from '../infrastructure/database/repositories/PostgresCurrencyWalletRepository';
import { PostgresUserRepository } from '../infrastructure/database/repositories/PostgresUserRepository';
import { PostgresVirtualCardRepository } from '../infrastructure/database/repositories/PostgresVirtualCardRepository';
import { InternalExchangeRateProvider } from '../infrastructure/exchange/InternalExchangeRateProvider';
import { AesGcmCardTokenVault } from '../infrastructure/security/AesGcmCardTokenVault';
import { HmacTokenService } from '../infrastructure/security/HmacTokenService';
import { RandomCardDetailsGenerator } from '../infrastructure/security/RandomCardDetailsGenerator';
import { ScryptPasswordHasher } from '../infrastructure/security/ScryptPasswordHasher';
import { SystemClock } from '../infrastructure/time/SystemClock';
import type { HttpAppDeps } from '../presentation/app';
import { AccountController } from '../presentation/controllers/AccountController';
import { AuthController } from '../presentation/controllers/AuthController';
import { CurrencyWalletController } from '../presentation/controllers/CurrencyWalletController';
import { HealthController } from '../presentation/controllers/HealthController';
import { VirtualCardController } from '../presentation/controllers/VirtualCardController';
import { createRequireAuth } from '../presentation/middlewares/authMiddleware';

export function buildContainer(): HttpAppDeps {
  // ---- Adaptadores de salida (driven) ----
  const clock = new SystemClock();
  const uow = new PostgresUnitOfWork(pool);
  const users = new PostgresUserRepository(pool);
  const accounts = new PostgresAccountRepository(pool);
  const movements = new PostgresAccountMovementRepository(pool);
  const cards = new PostgresVirtualCardRepository(pool);
  const currencyWallets = new PostgresCurrencyWalletRepository(pool);
  const currencyExchanges = new PostgresCurrencyExchangeRepository(pool);
  const exchangeRates = new InternalExchangeRateProvider(pool);
  const hasher = new ScryptPasswordHasher();
  const tokens = new HmacTokenService(env.jwtSecret, {
    access: env.accessTtlSeconds,
    refresh: env.refreshTtlSeconds,
  });
  const cardDetails = new RandomCardDetailsGenerator();
  const cardVault = new AesGcmCardTokenVault(env.jwtSecret);
  const healthCheck = new PostgresHealthCheck(pool);

  // ---- Adaptadores de entrada (driving) + casos de uso ----
  const auth = new AuthController(
    {
      register: new RegisterUserUseCase(users, hasher, tokens),
      login: new LoginUserUseCase(users, hasher, tokens),
      refresh: new RefreshSessionUseCase(users, tokens),
      getProfile: new GetUserProfileUseCase(users),
    },
    { secure: env.isProduction, refreshTtlSeconds: env.refreshTtlSeconds }
  );

  const accountController = new AccountController({
    list: new ListAccountsUseCase(accounts),
    createSavings: new CreateSavingsAccountUseCase(accounts),
    deposit: new DepositUseCase(uow),
    withdraw: new WithdrawUseCase(uow),
    transfer: new TransferBetweenAccountsUseCase(uow),
    transferExternal: new TransferToAccountNumberUseCase(uow, users),
    lookup: new LookupAccountByNumberUseCase(accounts, users),
    creditInterest: new CreditMonthlyInterestUseCase(uow, clock),
    movements: new ListAccountMovementsUseCase(movements),
  });

  const cardController = new VirtualCardController({
    list: new ListVirtualCardsUseCase(cards, uow, clock),
    create: new CreateVirtualCardUseCase(uow, cardDetails, cardVault, clock),
    reveal: new RevealCardDetailsUseCase(cards, cardVault),
    topUp: new TopUpVirtualCardUseCase(uow),
    unload: new UnloadVirtualCardUseCase(uow),
    updateLimits: new UpdateCardLimitsUseCase(uow, clock),
    updateStatus: new UpdateCardStatusUseCase(uow, clock),
    delete: new DeleteVirtualCardUseCase(uow),
    authorize: new ProcessCardTransactionUseCase(uow, clock),
  });

  const walletController = new CurrencyWalletController({
    overview: new GetMultiCurrencyOverviewUseCase(currencyWallets, currencyExchanges, exchangeRates, clock),
    rates: new ListExchangeRatesUseCase(exchangeRates, clock),
    exchanges: new ListCurrencyExchangesUseCase(currencyExchanges),
    open: new OpenCurrencyWalletUseCase(currencyWallets),
    close: new CloseCurrencyWalletUseCase(uow),
    quote: new PreviewCurrencyExchangeUseCase(exchangeRates, clock),
    exchange: new ExecuteCurrencyExchangeUseCase(uow, exchangeRates, clock),
  });

  return {
    controllers: {
      auth,
      accounts: accountController,
      cards: cardController,
      wallets: walletController,
      health: new HealthController(new CheckDatabaseHealthUseCase(healthCheck)),
    },
    requireAuth: createRequireAuth(tokens),
    corsOrigin: env.corsOrigin,
  };
}
