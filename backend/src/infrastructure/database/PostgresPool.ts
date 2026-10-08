import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load the backend's own .env regardless of the process working directory.
// In local development, prefer this file over stale inherited DB_* values.
dotenv.config({
  path: resolve(__dirname, '../../../.env'),
  override: process.env.NODE_ENV !== 'production',
});

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
