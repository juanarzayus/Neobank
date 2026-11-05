/**
 * Calendario del negocio: los días y meses se cuentan en hora de Bogotá,
 * sin depender de la zona horaria del servidor ni de la base de datos.
 */
export const BUSINESS_TIME_ZONE = 'America/Bogota';

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const zonedParts = (date: Date) => {
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Periodo de gasto: primer día del mes en curso, formato YYYY-MM-01. */
const spendingPeriod = (now: Date): string => {
  const { year, month } = zonedParts(now);
  return `${year}-${pad(month)}-01`;
};

/** Instante en que empezó el día de hoy (medianoche en la zona del negocio). */
const startOfDay = (now: Date): Date => {
  const p = zonedParts(now);
  const wallClockAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offsetMs = wallClockAsUtc - Math.floor(now.getTime() / 1000) * 1000;
  return new Date(Date.UTC(p.year, p.month - 1, p.day) - offsetMs);
};

const isSameMonth = (a: Date, b: Date): boolean => spendingPeriod(a) === spendingPeriod(b);

export const BusinessCalendar = { spendingPeriod, startOfDay, isSameMonth };
