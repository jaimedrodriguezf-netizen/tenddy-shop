import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { tenant_id } = await request.json();

    if (!tenant_id) {
      return NextResponse.json({ error: 'Falta tenant_id' }, { status: 400 });
    }

    const admin = getAdminClient();

    // Incrementar de forma atómica en PostgreSQL
    const { data, error } = await admin.rpc('increment_tenant_views', {
      target_tenant_id: tenant_id,
    });

    if (error) {
      // Fallback si RPC falla: UPDATE directo
      await admin
        .from('tenants')
        .update({ views_count: 1 })
        .eq('id', tenant_id);
    }

    return NextResponse.json({ success: true, views: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
