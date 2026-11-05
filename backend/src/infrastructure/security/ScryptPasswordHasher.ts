import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { IPasswordHasher } from '../../application/ports/IPasswordHasher';

const KEY_LENGTH = 64;

const derive = (password: string, salt: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) =>
    scrypt(password, salt, KEY_LENGTH, (err, key) => (err ? reject(err) : resolve(key)))
  );

/** Hash con scrypt y sal aleatoria. Formato almacenado: "<sal hex>:<clave hex>". */
export class ScryptPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await derive(password, salt);
    return `${salt.toString('hex')}:${key.toString('hex')}`;
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [saltHex, keyHex] = stored.split(':');
    if (!saltHex || !keyHex) return false;
    const expected = Buffer.from(keyHex, 'hex');
    const actual = await derive(password, Buffer.from(saltHex, 'hex'));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
