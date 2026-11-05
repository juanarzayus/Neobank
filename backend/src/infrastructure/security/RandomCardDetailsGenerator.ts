import { randomInt } from 'node:crypto';
import type { GeneratedCardDetails, ICardDetailsGenerator } from '../../application/ports/ICardDetailsGenerator';

const CARD_VALIDITY_YEARS = 4;

/** Genera número, CVV y vencimiento simulados con aleatoriedad criptográfica. */
export class RandomCardDetailsGenerator implements ICardDetailsGenerator {
  generate(now: Date): GeneratedCardDetails {
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + CARD_VALIDITY_YEARS);
    const mm = String(expiry.getMonth() + 1).padStart(2, '0');
    const yy = String(expiry.getFullYear()).slice(-2);

    return {
      cardNumber: '4' + Array.from({ length: 15 }, () => randomInt(0, 10)).join(''),
      cvv: String(randomInt(100, 1000)),
      expirationDate: `${mm}/${yy}`,
    };
  }
}
