import { Pool, types, type PoolClient } from 'pg';
import { env } from '../config/env';

// DATE (OID 1082) se entrega como texto 'YYYY-MM-DD' para evitar desfases de zona horaria.
types.setTypeParser(1082, (value: string) => value);

export const pool = new Pool(env.db);

/** Lo que necesita un repositorio: sirve tanto el pool como un cliente dentro de una transacción. */
export type Queryable = Pick<PoolClient, 'query'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PostgreSQL rechaza (error 22P02) un texto que no es UUID en una columna UUID; se trata como "no existe". */
export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID_RE.test(value);
