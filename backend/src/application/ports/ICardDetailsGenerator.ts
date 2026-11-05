export interface GeneratedCardDetails {
  /** PAN de 16 dígitos válido según el algoritmo de Luhn. */
  cardNumber: string;
  /** Últimos 4 dígitos del PAN. */
  last4: string;
  /** Código de seguridad de 3 dígitos. */
  cvv: string;
  /** Formato MM/AA. */
  expirationDate: string;
}

export interface ICardDetailsGenerator {
  generate(now: Date): GeneratedCardDetails;
}
