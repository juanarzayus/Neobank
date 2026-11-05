import { resolve } from 'node:path';
import dotenv from 'dotenv';

// Carga el .env del backend sin depender del directorio de trabajo.
// En desarrollo tiene prioridad sobre variables heredadas (p. ej. DB_* viejas del sistema).
dotenv.config({
  path: resolve(__dirname, '../../../.env'),
  override: process.env.NODE_ENV !== 'production',
});

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio en producción');
}

export const env = {
  isProduction,
  port: Number(process.env.PORT) || 3001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  accessTtlSeconds: 15 * 60,
  refreshTtlSeconds: 7 * 24 * 60 * 60,
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};
