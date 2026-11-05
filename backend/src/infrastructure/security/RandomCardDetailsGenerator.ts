import { randomInt } from 'node:crypto';
import type { GeneratedCardDetails, ICardDetailsGenerator } from '../../application/ports/ICardDetailsGenerator';

const CARD_VALIDITY_YEARS = 4;
/** BIN de tarjeta prepago virtual Visa (6 dígitos). */
const PREPAID_BIN = '453201';

/** Calcula el dígito verificador final según el algoritmo de Luhn para un prefijo de 15 dígitos. */
function computeLuhnCheckDigit(first15Digits: string): string {
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = Number(first15Digits[i]);
    // En un PAN de 16 dígitos, los índices pares (0, 2, ..., 14) se duplican
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return String(checkDigit);
}

/** Genera PAN válido por Luhn, últimos 4 dígitos, CVV y vencimiento con aleatoriedad criptográfica. */
export class RandomCardDetailsGenerator implements ICardDetailsGenerator {
  generate(now: Date): GeneratedCardDetails {
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + CARD_VALIDITY_YEARS);
    const mm = String(expiry.getMonth() + 1).padStart(2, '0');
    const yy = String(expiry.getFullYear()).slice(-2);

    const bodyDigits = Array.from({ length: 9 }, () => randomInt(0, 10)).join('');
    const first15 = PREPAID_BIN + bodyDigits;
    const checkDigit = computeLuhnCheckDigit(first15);
    const cardNumber = first15 + checkDigit;

    return {
      cardNumber,
      last4: cardNumber.slice(-4),
      cvv: String(randomInt(100, 1000)),
      expirationDate: `${mm}/${yy}`,
    };
  }
}
