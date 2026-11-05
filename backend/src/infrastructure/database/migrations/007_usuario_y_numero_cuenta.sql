-- 1) El inicio de sesión pasa a ser con nombre de usuario: se agrega username y se elimina email.
-- 2) Cada cuenta recibe un número de 10 dígitos para recibir transferencias de terceros.
-- Idempotente: migrate.ts re-ejecuta todos los archivos.

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30);
-- Usuarios previos (si los hubiera) reciben un usuario derivado de su id.
UPDATE users SET username = 'usuario_' || substr(replace(id::text, '-', ''), 1, 12)
WHERE username IS NULL;
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users (username);
ALTER TABLE users DROP COLUMN IF EXISTS email;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_number VARCHAR(10);
UPDATE accounts SET account_number = lpad(floor(random() * 10000000000)::bigint::text, 10, '0')
WHERE account_number IS NULL;
ALTER TABLE accounts ALTER COLUMN account_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_accounts_number ON accounts (account_number);
