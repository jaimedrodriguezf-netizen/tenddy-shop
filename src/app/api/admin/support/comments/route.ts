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

    // 3. Procesar foto o adjunto si viene en la réplica
    const attachments: Array<{ url: string; type: string }> = [];
    if (body.image_data && typeof body.image_data === 'string' && body.image_data.startsWith('data:')) {
      try {
        const matches = body.image_data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'webp';
          const buffer = Buffer.from(matches[2], 'base64');
          const filePath = `tickets/${ticket_id}/reply-${Date.now()}.${ext}`;

          const { error: uploadErr } = await admin.storage
            .from('support-attachments')
            .upload(filePath, buffer, { contentType: mimeType, upsert: true });

          if (!uploadErr) {
            const { data: pubData } = admin.storage
              .from('support-attachments')
              .getPublicUrl(filePath);
            if (pubData?.publicUrl) {
              attachments.push({ url: pubData.publicUrl, type: 'image' });
            }
          }
        }
      } catch (err) {
        console.error('Error subiendo adjunto de réplica a Storage:', err);
      }
    }

    // 4. Insertar comentario en el hilo
    const { data: comment, error: insertErr } = await admin
      .from('ticket_comments')
      .insert({
        ticket_id,
        sender_type,
        sender_name: sender_name?.trim() || (sender_type === 'support' ? 'Equipo de Soporte' : 'Administrador'),
        message: message.trim(),
        attachments,
      })
      .select('*')
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // 5. Si el comentario viene del equipo de soporte, incrementar notificaciones no leídas para el tenant
    if (sender_type === 'support') {
      await admin
        .from('support_tickets')
        .update({
          unread_tenant_count: (ticket.unread_tenant_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket_id);
    } else {
      // Si el cliente hace una réplica en un ticket que estaba solucionado, reabrir a 'in_progress'
      const newStatus = (ticket.status === 'resolved' || ticket.status === 'closed') ? 'in_progress' : ticket.status;

      await admin
        .from('support_tickets')
        .update({
          status: newStatus,
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
