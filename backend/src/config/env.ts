import 'dotenv/config';

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
};
