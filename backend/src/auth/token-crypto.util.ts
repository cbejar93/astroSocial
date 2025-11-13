import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const DEFAULT_KEY = 'astroSocialDemoEncryptionKey!!'; // 32 characters
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const getEncryptionKey = (): Buffer => {
  const key = process.env.REFRESH_TOKEN_ENCRYPTION_KEY;
  const normalized = (key && key.length >= 32)
    ? key.slice(0, 32)
    : (key ?? DEFAULT_KEY).padEnd(32, '0').slice(0, 32);
  return Buffer.from(normalized, 'utf8');
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
