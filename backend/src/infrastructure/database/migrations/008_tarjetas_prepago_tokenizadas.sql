-- Tokenización criptográfica y saldo prepago para tarjetas virtuales.
-- Idempotente: migrate.ts re-ejecuta todos los archivos en orden.

ALTER TABLE virtual_cards
    ADD COLUMN IF NOT EXISTS card_token VARCHAR(64),
    ADD COLUMN IF NOT EXISTS last4 VARCHAR(4),
    ADD COLUMN IF NOT EXISTS encrypted_pan TEXT,
    ADD COLUMN IF NOT EXISTS encrypted_cvv TEXT,
    ADD COLUMN IF NOT EXISTS prepaid_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS auto_debit_from_account BOOLEAN NOT NULL DEFAULT TRUE;

-- Rellenar datos para tarjetas previas que aún no estaban tokenizadas
UPDATE virtual_cards
SET card_token = COALESCE(card_token, 'tok_np_' || SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 24)),
    last4 = COALESCE(last4, RIGHT(card_number, 4)),
    encrypted_pan = COALESCE(encrypted_pan, card_number),
    encrypted_cvv = COALESCE(encrypted_cvv, cvv),
    card_number = '************' || RIGHT(card_number, 4),
    cvv = '***'
WHERE card_token IS NULL OR last4 IS NULL OR encrypted_pan IS NULL OR encrypted_cvv IS NULL;

ALTER TABLE virtual_cards
    ALTER COLUMN card_token SET NOT NULL,
    ALTER COLUMN last4 SET NOT NULL,
    ALTER COLUMN encrypted_pan SET NOT NULL,
    ALTER COLUMN encrypted_cvv SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_virtual_cards_token
    ON virtual_cards (card_token);

