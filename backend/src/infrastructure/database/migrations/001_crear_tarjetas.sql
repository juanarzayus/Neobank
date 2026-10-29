CREATE TABLE IF NOT EXISTS virtual_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL,
    card_number VARCHAR(16) NOT NULL,
    cardholder_name VARCHAR(100) NOT NULL,
    monthly_limit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    daily_limit NUMERIC(12, 2) DEFAULT NULL,
    current_spending NUMERIC(12, 2) NOT NULL DEFAULT 0,
    international_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    blocked_categories TEXT[] NOT NULL DEFAULT '{}',
    expiration_date VARCHAR(5) NOT NULL DEFAULT '12/28',
    cvv VARCHAR(4) NOT NULL DEFAULT '123',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
