import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const REQUIRED_KEY_LENGTH = 32;

const getEncryptionKey = (): Buffer => {
  const key = process.env.REFRESH_TOKEN_ENCRYPTION_KEY;
  if (!key || key.length < REQUIRED_KEY_LENGTH) {
    throw new Error(
      `REFRESH_TOKEN_ENCRYPTION_KEY must be set and at least ${REQUIRED_KEY_LENGTH} characters long. ` +
        'Generate one with: openssl rand -hex 16',
    );
  }
  return Buffer.from(key.slice(0, REQUIRED_KEY_LENGTH), 'utf8');
};

export const encryptRefreshToken = (token: string): string => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptRefreshToken = (encryptedToken: string): string => {
  const [ivHex, encryptedHex] = encryptedToken.split(':');
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted refresh token format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted.toString('utf8');
};
