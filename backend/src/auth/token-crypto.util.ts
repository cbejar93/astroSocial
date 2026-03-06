import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const REQUIRED_KEY_HEX_LENGTH = 64; // 32 bytes as hex

const getEncryptionKey = (): Buffer => {
  const key = process.env.REFRESH_TOKEN_ENCRYPTION_KEY;
  if (!key || key.length !== REQUIRED_KEY_HEX_LENGTH || !/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error(
      `REFRESH_TOKEN_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). ` +
        'Generate one with: openssl rand -hex 32',
    );
  }
  return Buffer.from(key, 'hex');
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
