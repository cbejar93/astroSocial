import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-ctr';
const SECRET = crypto
  .createHash('sha256')
  .update(String(process.env.EMAIL_ENCRYPTION_KEY || 'default_secret'))
  .digest();

export function encryptEmail(email: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET, iv);
  const encrypted = Buffer.concat([
    cipher.update(email, 'utf8'),
    cipher.final(),
  ]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptEmail(encrypted: string): string {
  const [ivHex, contentHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const content = Buffer.from(contentHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET, iv);
  const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
  return decrypted.toString('utf8');
}

export function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email).digest('hex');
}
