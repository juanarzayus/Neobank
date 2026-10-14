import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from './PostgresPool';

async function migrate() {
  const dir = join(__dirname, 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    await pool.query(readFileSync(join(dir, file), 'utf8'));
    console.log(`Migración aplicada: ${file}`);
  }
  await pool.end();
}

migrate().catch((err) => {
  console.error('Error en migraciones:', err.code ?? err.message);
  process.exit(1);
});
