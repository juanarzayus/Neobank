-- Cuentas (corriente + ahorros) y su libro de movimientos.
-- Idempotente: migrate.ts re-ejecuta todos los archivos.
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('CHECKING', 'SAVINGS')),
    name VARCHAR(100) NOT NULL,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    -- Tasa efectiva anual (0.04 = 4% EA). Solo aplica a cuentas de ahorro.
    annual_rate NUMERIC(6, 4) NOT NULL DEFAULT 0,
    last_interest_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un usuario tiene una sola cuenta corriente (las de ahorro pueden ser varias).
CREATE UNIQUE INDEX IF NOT EXISTS uq_accounts_user_checking
    ON accounts (user_id) WHERE type = 'CHECKING';
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts (user_id);

CREATE TABLE IF NOT EXISTS account_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'INTEREST')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    balance_after NUMERIC(14, 2) NOT NULL,
    related_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    description VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_tx_account
    ON account_transactions (account_id, created_at DESC);
