import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';
import { verifySuperadminToken } from '@/lib/session';

// Activar o suspender un Tenant desde la torre de control
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenddy_superadmin_session');

    if (!verifySuperadminToken(sessionCookie?.value)) {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, is_active, store_template, custom_landing_unlocked, is_decoupled, decoupled_url } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: 'Falta tenant_id' }, { status: 400 });
    }

    const admin = getAdminClient();
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (typeof is_active === 'boolean') {
      updates.is_active = is_active;
    }

    if (
      store_template !== undefined ||
      custom_landing_unlocked !== undefined ||
      is_decoupled !== undefined ||
      decoupled_url !== undefined
    ) {
      const { data: currentTenant } = await admin
        .from('tenants')
        .select('theme_config')
        .eq('id', tenant_id)
        .single();

      const currentTheme = currentTenant?.theme_config || {};
      updates.theme_config = {
        ...currentTheme,
        ...(store_template ? { store_template } : {}),
        ...(custom_landing_unlocked !== undefined ? { custom_landing_unlocked } : {}),
        ...(is_decoupled !== undefined ? { is_decoupled: Boolean(is_decoupled) } : {}),
        ...(decoupled_url !== undefined ? { decoupled_url: typeof decoupled_url === 'string' ? decoupled_url.trim() : '' } : {}),
      };
    }

    const { data: updated, error } = await admin
      .from('tenants')
      .update(updates)
      .eq('id', tenant_id)
      .select('id, slug, name, is_active, theme_config')
      .single();

    if (error) {
      console.error('Error actualizando tenant en superadmin:', error);
      return NextResponse.json({ error: 'No se pudo actualizar el estado de la tienda' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tenant: updated });
  } catch (err: unknown) {
    console.error('Excepción en /api/superadmin/tenants:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
