export interface PlainCardSecrets {
  cardNumber: string;
  cvv: string;
}

export interface TokenizedCardSecrets {
  /** Token criptográfico único de la tarjeta (ej. tok_np_...). */
  cardToken: string;
  /** PAN cifrado de forma autenticada (AES-256-GCM). */
  encryptedPan: string;
  /** CVV cifrado de forma autenticada (AES-256-GCM). */
  encryptedCvv: string;
}

/**
 * Puerto de salida para la bóveda de tokenización de tarjetas (Token Vault).
 * Emite el token de tarjeta y cifra/descifra los datos sensibles (PAN y CVV).
 */
export interface ICardTokenVault {
  tokenize(secrets: PlainCardSecrets): TokenizedCardSecrets;
  detokenize(encryptedPan: string, encryptedCvv: string, fallbackLast4?: string): PlainCardSecrets;
}

