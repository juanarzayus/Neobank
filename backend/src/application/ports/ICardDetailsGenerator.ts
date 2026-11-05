export interface GeneratedCardDetails {
  cardNumber: string;
  cvv: string;
  /** Formato MM/AA. */
  expirationDate: string;
}

export interface ICardDetailsGenerator {
  generate(now: Date): GeneratedCardDetails;
}
