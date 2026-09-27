import { cookies } from 'next/headers';
import { getAdminClient } from './supabase';

export interface AuthGuardResult {
  authorized: boolean;
  isSuperadmin: boolean;
  tenant?: {
    id: string;
    slug: string;
    name: string;
  };
  error?: string;
}

/**
 * Valida de forma estricta que la sesión corresponda al tenant que se desea consultar o modificar.
 * Previene vulnerabilidades BOLA/IDOR (Cross-Tenant Tampering).
 * Superadmin tiene acceso global.
 */
export async function verifyTenantAdmin(
  identifier: { tenantId?: string; shopSlug?: string }
): Promise<AuthGuardResult> {
  const cookieStore = await cookies();

  // 1. Validar si es superadmin global
  const superadminCookie = cookieStore.get('tenddy_superadmin_session');
  const isSuperadmin = superadminCookie?.value === 'authenticated';

  const { tenantId, shopSlug } = identifier;
  if (!tenantId && !shopSlug) {
    return { authorized: false, isSuperadmin: false, error: 'Falta identificador del tenant' };
  }

  const admin = getAdminClient();
  let targetTenant: { id: string; slug: string; name: string } | null = null;

  if (tenantId) {
    const { data } = await admin
      .from('tenants')
      .select('id, slug, name')
      .eq('id', tenantId)
      .single();
    targetTenant = data;
  } else if (shopSlug) {
    const { data } = await admin
      .from('tenants')
      .select('id, slug, name')
      .eq('slug', shopSlug.toLowerCase().trim())
      .single();
    targetTenant = data;
  }

  if (!targetTenant) {
    return { authorized: false, isSuperadmin: false, error: 'Tenant no encontrado' };
  }

  // Si es superadmin y el tenant existe, conceder acceso
  if (isSuperadmin) {
    return { authorized: true, isSuperadmin: true, tenant: targetTenant };
  }

  // 2. Validar cookie administrativa vinculada EXCLUSIVAMENTE al slug de este tenant
  const tenantCookie = cookieStore.get(`admin_session_${targetTenant.slug}`);
  if (tenantCookie?.value === 'authenticated') {
    return { authorized: true, isSuperadmin: false, tenant: targetTenant };
  }

  return { authorized: false, isSuperadmin: false, error: 'Sesión no autorizada para esta tienda' };
}
