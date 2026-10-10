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
      // Fallback defensivo si RPC no está disponible: leer valor previo e incrementar de forma segura
      const { data: tenantData } = await admin
        .from('tenants')
        .select('views_count')
        .eq('id', tenant_id)
        .single();

      const currentViews = tenantData?.views_count || 0;
      await admin
        .from('tenants')
        .update({ views_count: currentViews + 1 })
        .eq('id', tenant_id);
    }

    return NextResponse.json({ success: true, views: data });
  } catch (err: unknown) {
    console.error('Error en POST /api/views:', err);
    return NextResponse.json({ error: 'Error del servidor al registrar visita' }, { status: 500 });
  }
}
