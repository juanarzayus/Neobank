-- Agregar reglas de gasto, fecha de vencimiento y CVV a virtual_cards
-- Idempotente: migrate.ts re-ejecuta todos los archivos
ALTER TABLE virtual_cards
    ADD COLUMN IF NOT EXISTS daily_limit NUMERIC(12, 2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS international_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS blocked_categories TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS expiration_date VARCHAR(5) NOT NULL DEFAULT '12/28',
    ADD COLUMN IF NOT EXISTS cvv VARCHAR(4) NOT NULL DEFAULT '123';

