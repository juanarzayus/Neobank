import type { Request } from 'express';
import { ValidationError } from '../../domain/errors/DomainError';

/**
 * Validación de FORMA de la petición (tipos JSON). Las reglas de VALOR
 * (montos positivos, longitudes, categorías válidas...) viven en el dominio.
 */
export type Body = Record<string, unknown>;

export const bodyOf = (req: Request): Body =>
  req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? (req.body as Body) : {};

const isAbsent = (value: unknown) => value === undefined || value === null;

/** Texto o cadena vacía: deja que el dominio diga qué falta. */
export const stringOrEmpty = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Texto o undefined, ignorando valores de otro tipo. */
export const stringOrUndefined = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

export function requireString(value: unknown, message: string): string {
  if (typeof value !== 'string') throw new ValidationError(message);
  return value;
}

export function optionalString(value: unknown, message: string): string | undefined {
  return isAbsent(value) ? undefined : requireString(value, message);
}

export function requireNumber(value: unknown, message: string): number {
  if (typeof value !== 'number') throw new ValidationError(message);
  return value;
}

export function optionalNumber(value: unknown, message: string): number | undefined {
  return value === undefined ? undefined : requireNumber(value, message);
}

/** undefined = no se envió; null = se envió explícitamente vacío. */
export function nullableNumber(value: unknown, message: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return requireNumber(value, message);
}

export function optionalBoolean(value: unknown, message: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw new ValidationError(message);
  return value;
}

export function optionalStringArray(value: unknown, message: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) throw new ValidationError(message);
  return value;
}
