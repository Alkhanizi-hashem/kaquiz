import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH) as Buffer;
  return `scrypt:${salt.toString('base64')}:${key.toString('base64')}`;
}

export async function verifyPassword(password: string, encodedHash: string) {
  const [algorithm, saltText, keyText] = encodedHash.split(':');
  if (algorithm !== 'scrypt' || !saltText || !keyText) return false;
  const expected = Buffer.from(keyText, 'base64');
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await scryptAsync(password, Buffer.from(saltText, 'base64'), expected.length) as Buffer;
  return timingSafeEqual(actual, expected);
}

export async function performDummyPasswordWork(value: string) {
  await scryptAsync(value, 'kaquiz-enumeration-salt', KEY_LENGTH);
}
