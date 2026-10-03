import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticket_id, tenant_id, message, sender_name, sender_type = 'tenant' } = body;

    if (!ticket_id || !message || !message.trim()) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1. Obtener ticket para verificar pertenencia
    const { data: ticket, error: ticketErr } = await admin
      .from('support_tickets')
      .select('id, tenant_id, unread_tenant_count, status')
      .eq('id', ticket_id)
      .single();

    if (ticketErr || !ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // 2. Validar autorización
    const targetTenantId = tenant_id || ticket.tenant_id;
    if (targetTenantId) {
      const auth = await verifyTenantAdmin({ tenantId: targetTenantId });
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
      }
    }

    // 3. Insertar comentario en el hilo
    const { data: comment, error: insertErr } = await admin
      .from('ticket_comments')
      .insert({
        ticket_id,
        sender_type,
        sender_name: sender_name?.trim() || (sender_type === 'support' ? 'Equipo de Soporte' : 'Administrador'),
        message: message.trim(),
      })
      .select('*')
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // 4. Si el comentario viene del equipo de soporte, incrementar notificaciones no leídas para el tenant
    if (sender_type === 'support') {
      await admin
        .from('support_tickets')
        .update({
          unread_tenant_count: (ticket.unread_tenant_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket_id);
    } else {
      // Si el tenant responde y el ticket estaba en revisión o resuelto, actualizar timestamp
      await admin
        .from('support_tickets')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket_id);
    }

    return NextResponse.json({ success: true, comment });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
