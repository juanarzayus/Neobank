import { ref } from 'vue';

export type NumberLocale = 'es-CO' | 'en-US';

const STORAGE_KEY = 'nova_number_locale';
const savedLocale = (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) as NumberLocale | null;

export const numberLocale = ref<NumberLocale>(
  savedLocale === 'es-CO' || savedLocale === 'en-US' ? savedLocale : 'en-US'
);

export const setNumberLocale = (locale: NumberLocale) => {
  numberLocale.value = locale;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale);
  }
};

/**
 * Formatea un número para visualización con 2 decimales según el formato activo:
 * - en-US: miles con coma (,) y decimales con punto (.) -> 1,500.50
 * - es-CO: miles con punto (.) y decimales con coma (,) -> 1.500,50
 */
export const formatAmount = (n: number): string =>
  Number(n || 0).toLocaleString(numberLocale.value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Formatea un número entero con separador de miles según el formato activo.
 */
export const formatInteger = (n: number): string =>
  Number(n || 0).toLocaleString(numberLocale.value, {
    maximumFractionDigits: 0,
  });

/**
 * Formatea en vivo el valor de un input mientras el usuario escribe,
 * aplicando el separador de miles y decimales del formato activo (es-CO o en-US).
 */
export const formatMoneyInput = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '';

  const isEsCO = numberLocale.value === 'es-CO';
  const thousandsSep = isEsCO ? '.' : ',';
  const decimalSep = isEsCO ? ',' : '.';

  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return '';
    const [intPart, decPart] = String(val).split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
    return decPart !== undefined ? `${formattedInt}${decimalSep}${decPart.slice(0, 2)}` : formattedInt;
  }

  let raw = String(val);
  // Eliminar separadores de miles actuales y dejar solo dígitos y el separador decimal activo
  raw = raw.split(thousandsSep).join('');
  const cleanRegex = isEsCO ? /[^\d,]/g : /[^\d.]/g;
  raw = raw.replace(cleanRegex, '');

  const parts = raw.split(decimalSep);
  const intDigits = parts[0].replace(/^0+(?=\d)/, '');
  const formattedInt = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);

  if (parts.length > 1) {
    const decDigits = parts.slice(1).join('').slice(0, 2);
    return `${formattedInt || '0'}${decimalSep}${decDigits}`;
  }
  return formattedInt;
};

/**
 * Convierte el texto formateado en número para enviarlo al backend.
 */
export const parseMoney = (val: string | number | null | undefined): number | null => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;

  const isEsCO = numberLocale.value === 'es-CO';
  const normalized = isEsCO
    ? String(val).replace(/\./g, '').replace(',', '.')
    : String(val).replace(/,/g, '');

  if (!normalized) return null;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
};

