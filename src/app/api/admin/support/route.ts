import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Falta tenantId' }, { status: 400 });
    }

    const auth = await verifyTenantAdmin({ tenantId });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();

    // Obtener tickets del tenant con sus comentarios ordenados
    const { data: tickets, error } = await admin
      .from('support_tickets')
      .select('*, ticket_comments(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo tickets en admin/support:', error);
      return NextResponse.json({ error: 'No se pudieron consultar los tickets' }, { status: 500 });
    }

    // Calcular total de notificaciones no leídas para el tenant
    const totalUnread = (tickets || []).reduce((sum, t) => sum + (t.unread_tenant_count || 0), 0);

    return NextResponse.json({
      success: true,
      tickets: tickets || [],
      totalUnread,
    });
  } catch (err: unknown) {
    console.error('Excepción en GET /api/admin/support:', err);
    return NextResponse.json({ error: 'Error del servidor al obtener tickets' }, { status: 500 });
  }
}

// Marcar ticket como leído por el tenant
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, tenantId } = body;

    if (!ticketId || !tenantId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const auth = await verifyTenantAdmin({ tenantId });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();
    const { error } = await admin
      .from('support_tickets')
      .update({ unread_tenant_count: 0 })
      .eq('id', ticketId)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error actualizando contador no leído en admin/support:', error);
      return NextResponse.json({ error: 'No se pudo actualizar el estado del ticket' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Excepción en PATCH /api/admin/support:', err);
    return NextResponse.json({ error: 'Error del servidor al actualizar el ticket' }, { status: 500 });
  }
}
