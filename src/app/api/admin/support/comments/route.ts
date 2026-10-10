import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';
import { verifySuperadminToken } from '@/lib/session';

const ALLOWED_ATTACHMENT_MIMES: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'text/csv': 'csv',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticket_id, tenant_id, message, sender_name, sender_type = 'tenant' } = body;

    if (!ticket_id || !message || !message.trim()) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    if (message.trim().length > 5000) {
      return NextResponse.json({ error: 'El mensaje excede el límite de 5000 caracteres' }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1. Obtener ticket de la BD para verificar pertenencia legítima
    const { data: ticket, error: ticketErr } = await admin
      .from('support_tickets')
      .select('id, tenant_id, unread_tenant_count, status')
      .eq('id', ticket_id)
      .single();

    if (ticketErr || !ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // 2. Blindaje BOLA/IDOR: Validar autorización estricta contra el tenant real del ticket
    const cookieStore = await cookies();
    const isSuperadmin = verifySuperadminToken(cookieStore.get('tenddy_superadmin_session')?.value);

    if (ticket.tenant_id) {
      // Si el cliente suministró tenant_id en el payload, debe coincidir exactamente con el del ticket
      if (tenant_id && tenant_id !== ticket.tenant_id) {
        return NextResponse.json({ error: 'Identificador de tienda no coincide con el ticket' }, { status: 403 });
      }

      if (!isSuperadmin) {
        const auth = await verifyTenantAdmin({ tenantId: ticket.tenant_id });
        if (!auth.authorized) {
          return NextResponse.json({ error: auth.error || 'No autorizado para este ticket' }, { status: 401 });
        }
      }
    } else {
      // Para tickets anónimos de plataforma sin tienda, solo Superadmin puede responder
      if (!isSuperadmin) {
        return NextResponse.json({ error: 'Solo el Superadmin puede responder tickets anónimos' }, { status: 401 });
      }
    }

    // 3. Procesar foto o adjunto si viene en la réplica (Subida obligatoria a Supabase Storage, NUNCA base64 en BD)
    const attachments: Array<{ url: string; type: string }> = [];

    if (body.image_data && typeof body.image_data === 'string' && body.image_data.startsWith('data:')) {
      const commaIndex = body.image_data.indexOf(',');
      if (commaIndex !== -1) {
        const mimeMatch = body.image_data.substring(0, commaIndex).match(/data:([^;]+);base64/);
        const rawMime = mimeMatch ? mimeMatch[1].toLowerCase().trim() : '';
        const ext = ALLOWED_ATTACHMENT_MIMES[rawMime];

        if (!ext) {
          return NextResponse.json(
            { error: 'Tipo de archivo no permitido. Solo se aceptan imágenes (WebP, JPG, PNG) o documentos (PDF, Excel, CSV).' },
            { status: 400 }
          );
        }

        const base64Data = body.image_data.substring(commaIndex + 1);
        const buffer = Buffer.from(base64Data, 'base64');

        // Límite de 5MB por adjunto
        if (buffer.length > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'El archivo adjunto excede el límite de 5MB' },
            { status: 400 }
          );
        }

        const filePath = `tickets/${ticket_id}/reply-${Date.now()}.${ext}`;
        const { error: uploadErr } = await admin.storage
          .from('support-attachments')
          .upload(filePath, buffer, { contentType: rawMime, upsert: true });

        if (uploadErr) {
          console.error('Error subiendo adjunto a Storage en réplica:', uploadErr);
          return NextResponse.json({ error: 'No se pudo almacenar el archivo adjunto' }, { status: 500 });
        }

        const { data: pubData } = admin.storage
          .from('support-attachments')
          .getPublicUrl(filePath);

        if (pubData?.publicUrl) {
          const isDoc = ext === 'pdf' || ext === 'xlsx' || ext === 'xls' || ext === 'csv';
          attachments.push({ url: pubData.publicUrl, type: isDoc ? 'document' : 'image' });
        }
      }
    }

    // 4. Insertar comentario en el hilo (con URLs públicas de Storage, nunca base64 crudo)
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
      console.error('Error insertando comentario en ticket:', insertErr);
      return NextResponse.json({ error: 'No se pudo registrar la respuesta en el ticket' }, { status: 500 });
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
    console.error('Excepción en POST /api/admin/support/comments:', err);
    return NextResponse.json({ error: 'Error del servidor al procesar la respuesta' }, { status: 500 });
  }
}
