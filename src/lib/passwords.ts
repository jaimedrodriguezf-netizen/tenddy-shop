import crypto from 'crypto';

/**
 * Función criptográfica estándar OWASP para hashing con salt (PBKDF2-SHA512)
 * 100,000 iteraciones con salt criptográfico de 16 bytes.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

/**
 * Verifica una contraseña en texto plano contra un hash PBKDF2-SHA512 con salt.
 * Utiliza crypto.timingSafeEqual para proteger contra ataques de temporización.
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!password || !storedHash || typeof storedHash !== 'string' || !storedHash.startsWith('pbkdf2$')) {
    return false;
  }

  try {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;

    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];

    if (!iterations || !salt || !originalHash) return false;

    const computedHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');

    const compBuf = Buffer.from(computedHash, 'utf8');
    const origBuf = Buffer.from(originalHash, 'utf8');

    if (compBuf.length !== origBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(compBuf, origBuf);
  } catch {
    return false;
  }
}
