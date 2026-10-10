import crypto from 'crypto';

interface SessionPayload {
  sub: string; // 'superadmin' o slug de la tienda
  role: 'superadmin' | 'tenant_admin';
  tenant_id?: string;
  iat: number;
  exp: number;
}

function getSessionSecret(): string {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.SUPERADMIN_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'tenddy_fallback_cryptographic_secret_2026';
  return secret;
}

/**
 * Crea un token de sesión criptográfico firmado con HMAC-SHA256.
 * Formato: `<payloadBase64Url>.<signatureBase64Url>`
 */
function signToken(payload: SessionPayload): string {
  const secret = getSessionSecret();
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifica la firma HMAC-SHA256 y la expiración del token.
 * Previene ataques de temporización usando timingSafeEqual.
 */
function verifyToken(token?: string | null): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const secret = getSessionSecret();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expectedSignature, 'utf8');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: SessionPayload = JSON.parse(payloadStr);

    // Validar expiración
    if (Date.now() > payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Genera un token firmado para la sesión de Superadmin (vigencia: 7 días)
 */
export function createSuperadminToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: 'superadmin',
    role: 'superadmin',
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 días
  };
  return signToken(payload);
}

/**
 * Valida si un token corresponde a una sesión auténtica y vigente de Superadmin
 */
export function verifySuperadminToken(token?: string | null): boolean {
  const payload = verifyToken(token);
  if (!payload) return false;
  return payload.role === 'superadmin' && payload.sub === 'superadmin';
}

/**
 * Genera un token firmado para la sesión administrativa de una tienda (vigencia: 30 días)
 */
export function createTenantAdminToken(shopSlug: string, tenantId?: string): string {
  const cleanSlug = shopSlug.trim().toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: cleanSlug,
    role: 'tenant_admin',
    tenant_id: tenantId,
    iat: now,
    exp: now + 30 * 24 * 60 * 60, // 30 días
  };
  return signToken(payload);
}

/**
 * Valida si un token corresponde a una sesión auténtica y vigente para la tienda solicitada
 */
export function verifyTenantAdminToken(token?: string | null, expectedShopSlug?: string): boolean {
  if (!expectedShopSlug) return false;
  const payload = verifyToken(token);
  if (!payload) return false;
  return (
    payload.role === 'tenant_admin' &&
    payload.sub.toLowerCase() === expectedShopSlug.trim().toLowerCase()
  );
}
