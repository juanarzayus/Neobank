-- Agregar categoría opcional a los movimientos de cuenta para distribución de gastos
-- Idempotente: migrate.ts re-ejecuta todos los archivos
ALTER TABLE account_transactions
    ADD COLUMN IF NOT EXISTS category VARCHAR(40) DEFAULT NULL;

