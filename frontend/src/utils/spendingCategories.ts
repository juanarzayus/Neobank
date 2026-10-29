import type { AccountMovement } from '@/types/accounts';

export type SpendingCategoryId =
  | 'FOOD'
  | 'SHOPPING'
  | 'TRANSPORT'
  | 'UTILITIES'
  | 'ENTERTAINMENT'
  | 'HEALTH'
  | 'EDUCATION'
  | 'CASH'
  | 'TRANSFERS'
  | 'OTHER';

export interface SpendingCategoryMeta {
  id: SpendingCategoryId;
  label: string;
  icon: string;
  color: string;
}

export const ALL_SPENDING_CATEGORIES: SpendingCategoryMeta[] = [
  { id: 'FOOD', label: 'Alimentación', icon: '🍔', color: '#f59e0b' },
  { id: 'SHOPPING', label: 'Compras', icon: '🛍️', color: '#00e5c0' },
  { id: 'TRANSPORT', label: 'Transporte', icon: '🚗', color: '#3b82f6' },
  { id: 'UTILITIES', label: 'Servicios', icon: '💡', color: '#06b6d4' },
  { id: 'ENTERTAINMENT', label: 'Ocio', icon: '🎬', color: '#ec4899' },
  { id: 'HEALTH', label: 'Salud', icon: '💊', color: '#10b981' },
  { id: 'EDUCATION', label: 'Educación', icon: '📚', color: '#6366f1' },
  { id: 'CASH', label: 'Efectivo', icon: '🏧', color: '#f97316' },
  { id: 'TRANSFERS', label: 'Transferencias', icon: '⇄', color: '#8b5cf6' },
  { id: 'OTHER', label: 'Otros', icon: '📦', color: '#94a3b8' },
];

/** Categorías elegibles al retirar o registrar un gasto desde Billetera. */
export const WALLET_SPENDING_CATEGORIES: SpendingCategoryMeta[] = ALL_SPENDING_CATEGORIES.filter(
  (c) => c.id !== 'TRANSFERS'
);

/** Categorías elegibles al realizar un pago con tarjeta virtual. */
export const CARD_SPENDING_CATEGORIES: SpendingCategoryMeta[] = ALL_SPENDING_CATEGORIES.filter(
  (c) => c.id !== 'CASH' && c.id !== 'TRANSFERS'
);

const CATEGORY_MAP = new Map<string, SpendingCategoryMeta>(
  ALL_SPENDING_CATEGORIES.map((c) => [c.id, c])
);

export function getCategoryById(id?: string | null): SpendingCategoryMeta | null {
  if (!id) return null;
  return CATEGORY_MAP.get(id.toUpperCase()) ?? null;
}

/** Resuelve la categoría de un movimiento de egreso (incluye fallback para movimientos previos). */
export function resolveMovementCategory(m: AccountMovement): SpendingCategoryMeta {
  const explicit = getCategoryById(m.category);
  if (explicit) return explicit;

  if (m.type === 'TRANSFER_OUT') {
    return CATEGORY_MAP.get('TRANSFERS')!;
  }
  if (m.description && /^Pago:\s*/i.test(m.description)) {
    return CATEGORY_MAP.get('SHOPPING')!;
  }
  return CATEGORY_MAP.get('CASH')!;
}

/** Extrae el comercio y el ID de tarjeta si el movimiento corresponde a un pago con tarjeta virtual. */
export function extractCardPaymentInfo(
  m: AccountMovement
): { merchantName: string; cardId: string } | null {
  if (!m.description) return null;
  const match = m.description.match(/^Pago:\s*(.+?)\s*\[([^\]]+)\]$/i);
  if (!match) return null;
  return { merchantName: match[1].trim(), cardId: match[2].trim() };
}

export function isCardMovement(m: AccountMovement): boolean {
  return extractCardPaymentInfo(m) !== null;
}

/** Limpia el sufijo interno [cardId] de las descripciones de pagos con tarjeta para mostrar en UI. */
export function formatMovementLabel(m: AccountMovement, fallbackLabel: string): string {
  if (!m.description) return fallbackLabel;
  const cardInfo = extractCardPaymentInfo(m);
  if (cardInfo) return `Pago: ${cardInfo.merchantName}`;
  return m.description.trim() || fallbackLabel;
}

