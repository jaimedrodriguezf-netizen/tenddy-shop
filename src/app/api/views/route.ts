import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate limiting: máximo 30 conteos de visitas por minuto por IP
    const { isAllowed } = checkRateLimit(`views_${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 30,
    });

    if (!isAllowed) {
      return NextResponse.json({ success: true, ignored: true });
    }

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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
