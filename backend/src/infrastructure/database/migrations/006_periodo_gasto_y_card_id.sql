-- 1) Vincular cada movimiento de pago con su tarjeta (antes se buscaba con LIKE sobre la descripción).
-- 2) Guardar el mes al que corresponde current_spending para reiniciarlo cada mes.
-- Idempotente: migrate.ts re-ejecuta todos los archivos.
ALTER TABLE account_transactions
    ADD COLUMN IF NOT EXISTS card_id UUID REFERENCES virtual_cards(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_account_tx_card
    ON account_transactions (card_id, created_at);

-- Rellenar card_id de pagos antiguos a partir de la descripción "Pago: <comercio> [<card_id>]".
UPDATE account_transactions t
SET card_id = c.id
FROM virtual_cards c
WHERE t.card_id IS NULL
  AND t.description LIKE '%[' || c.id::text || ']';

ALTER TABLE virtual_cards
    ADD COLUMN IF NOT EXISTS spending_period DATE NOT NULL
        DEFAULT (date_trunc('month', NOW() AT TIME ZONE 'America/Bogota'))::date;

-- Recalcular el gasto del mes en curso a partir de los movimientos reales.
UPDATE virtual_cards c
SET spending_period = (date_trunc('month', NOW() AT TIME ZONE 'America/Bogota'))::date,
    current_spending = COALESCE((
        SELECT SUM(t.amount)
        FROM account_transactions t
        WHERE t.card_id = c.id
          AND t.created_at >= date_trunc('month', NOW() AT TIME ZONE 'America/Bogota') AT TIME ZONE 'America/Bogota'
    ), 0);
