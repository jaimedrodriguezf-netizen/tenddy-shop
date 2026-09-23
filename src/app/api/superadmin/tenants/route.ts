import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';

// Activar o suspender un Tenant desde la torre de control
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenddy_superadmin_session');

    if (sessionCookie?.value !== 'authenticated') {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const { tenant_id, is_active } = await request.json();

    if (!tenant_id || typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: updated, error } = await admin
      .from('tenants')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', tenant_id)
      .select('id, slug, name, is_active')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tenant: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
