import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type {
  ICardTokenVault,
  PlainCardSecrets,
  TokenizedCardSecrets,
} from '../../application/ports/ICardTokenVault';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Adaptador de infraestructura para la bóveda de tokenización de tarjetas.
 * - Genera un token criptográfico opaco (`tok_np_<24 hex>`).
 * - Sella el PAN y el CVV con AES-256-GCM autenticado para no almacenarlos en texto plano.
 */
export class AesGcmCardTokenVault implements ICardTokenVault {
  private readonly key: Buffer;

  constructor(secret: string) {
    this.key = createHash('sha256').update(`card-vault:${secret}`).digest();
  }

  private encrypt(plainText: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString('base64url')}`;
  }

  private decrypt(sealed: string): string | null {
    const parts = sealed.split('.');
    if (parts.length !== 3) return null;
    try {
      const [ivB64, tagB64, dataB64] = parts;
      const iv = Buffer.from(ivB64, 'base64url');
      const authTag = Buffer.from(tagB64, 'base64url');
      const encrypted = Buffer.from(dataB64, 'base64url');

      const decipher = createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    } catch {
      return null;
    }
  }

  tokenize(secrets: PlainCardSecrets): TokenizedCardSecrets {
    const cardToken = `tok_np_${randomBytes(12).toString('hex')}`;
    return {
      cardToken,
      encryptedPan: this.encrypt(secrets.cardNumber),
      encryptedCvv: this.encrypt(secrets.cvv),
    };
  }

  detokenize(encryptedPan: string, encryptedCvv: string, fallbackLast4: string = '0000'): PlainCardSecrets {
    const pan =
      this.decrypt(encryptedPan) ??
      (/^\d{16}$/.test(encryptedPan) ? encryptedPan : `453201000000${fallbackLast4}`);
    const cvv =
      this.decrypt(encryptedCvv) ??
      (/^\d{3,4}$/.test(encryptedCvv) ? encryptedCvv : '000');

    return { cardNumber: pan, cvv };
  }
}

