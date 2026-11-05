-- Billetera multimoneda y motor de tasas de cambio internas.
-- Idempotente: migrate.ts re-ejecuta todos los archivos en orden.

CREATE TABLE IF NOT EXISTS exchange_rates (
    currency VARCHAR(5) PRIMARY KEY
        CHECK (currency IN ('USD', 'EUR', 'GBP', 'MXN', 'BRL')),
    cop_rate NUMERIC(18, 6) NOT NULL CHECK (cop_rate > 0),
    spread_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.0050
        CHECK (spread_rate >= 0 AND spread_rate < 0.2),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Semilla de tasas de cambio internas de tesorería NOVA (valor medio en COP + margen operativo interno).
INSERT INTO exchange_rates (currency, cop_rate, spread_rate)
VALUES
    ('USD', 4150.000000, 0.0050),
    ('EUR', 4520.000000, 0.0060),
    ('GBP', 5280.000000, 0.0065),
    ('MXN',  215.000000, 0.0080),
    ('BRL',  740.000000, 0.0080)
ON CONFLICT (currency) DO NOTHING;

CREATE TABLE IF NOT EXISTS currency_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(5) NOT NULL
        CHECK (currency IN ('USD', 'EUR', 'GBP', 'MXN', 'BRL')),
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_currency_wallets_user_currency
    ON currency_wallets (user_id, currency);
CREATE INDEX IF NOT EXISTS idx_currency_wallets_user
    ON currency_wallets (user_id, created_at);

CREATE TABLE IF NOT EXISTS currency_exchanges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_currency VARCHAR(5) NOT NULL
        CHECK (from_currency IN ('COP', 'USD', 'EUR', 'GBP', 'MXN', 'BRL')),
    to_currency VARCHAR(5) NOT NULL
        CHECK (to_currency IN ('COP', 'USD', 'EUR', 'GBP', 'MXN', 'BRL')),
    from_amount NUMERIC(14, 2) NOT NULL CHECK (from_amount > 0),
    to_amount NUMERIC(14, 2) NOT NULL CHECK (to_amount > 0),
    rate_applied NUMERIC(18, 8) NOT NULL CHECK (rate_applied > 0),
    spread_percent NUMERIC(6, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (from_currency <> to_currency)
);

CREATE INDEX IF NOT EXISTS idx_currency_exchanges_user
    ON currency_exchanges (user_id, created_at DESC);

