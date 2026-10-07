import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
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

  // 3. Respaldo Resiliente: Validar sesión autenticada de Supabase Auth / Google OAuth
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const { data: membership } = await admin
        .from('tenant_members')
        .select('id, role, is_active')
        .eq('tenant_id', targetTenant.id)
        .eq('email', user.email.toLowerCase().trim())
        .eq('is_active', true)
        .single();

      if (membership) {
        return { authorized: true, isSuperadmin: false, tenant: targetTenant };
      }
    }
  } catch (authErr) {
    console.error('Error validando sesión Supabase en auth-guard:', authErr);
  }

  return { authorized: false, isSuperadmin: false, error: 'Sesión no autorizada para esta tienda' };
}
