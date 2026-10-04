import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Subir adjunto base64 (imagen, Excel, CSV o PDF) a Supabase Storage y devolver URL pública
async function uploadAttachmentToStorage(
  base64DataUrl: string,
  ticketNumber: string
): Promise<string | null> {
  try {
    const commaIndex = base64DataUrl.indexOf(',');
    if (commaIndex === -1) return null;

    const mimeMatch = base64DataUrl.substring(0, commaIndex).match(/data:([^;]+);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const base64Data = base64DataUrl.substring(commaIndex + 1);
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'bin';
    if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('spreadsheetml') || mimeType.includes('excel') || mimeType.includes('xlsx')) ext = 'xlsx';
    else if (mimeType.includes('csv')) ext = 'csv';
    else if (mimeType.includes('pdf')) ext = 'pdf';

    const filePath = `tickets/${ticketNumber}-${Date.now()}.${ext}`;

    const admin = getAdminClient();
    const { error: uploadError } = await admin.storage
      .from('support-attachments')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error subiendo adjunto a Supabase Storage:', uploadError);
      return null;
    }

    const { data: publicUrlData } = admin.storage
      .from('support-attachments')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('Error procesando adjunto para storage:', err);
    return null;
  }
}

// 1. Enviar nuevo ticket de soporte con imagen y notificar vía Supabase Edge Function
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sender_name,
      sender_phone,
      sender_email,
      subject,
      message,
      image_data,
      tenant_id,
      category,
      _hp_check,
    } = body;

    // Honeypot anti-spam
    if (_hp_check) {
      return NextResponse.json({ success: true, ticket_number: 'TICK-SPAM' });
    }

    const clientIp = getClientIp(request);

    // Límite de seguridad y gestión operativa de cola:
    // Para tiendas registradas (tenant_id): permitimos hasta 15 tickets cada 10 min para ingresar requerimientos en orden sin saturar la capacidad operativa del equipo.
    // Para consultas anónimas de visitantes: 10 tickets cada 10 min.
    const rateLimitKey = tenant_id ? `ticket_tenant_${tenant_id}` : `ticket_ip_${clientIp}`;
    const maxRequests = tenant_id ? 15 : 10;

    const { isAllowed } = checkRateLimit(rateLimitKey, {
      windowMs: 10 * 60 * 1000,
      maxRequests,
    });

    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            'Por motivos de seguridad y para atender cada requerimiento con la máxima atención, recibimos tus solicitudes en cola organizada. Por favor espera unos minutos antes de enviar un nuevo ticket mientras nuestro equipo atiende los que ya están en proceso.',
        },
        { status: 429 }
      );
    }

    if (!sender_name || !sender_phone || !message) {
      return NextResponse.json(
        { error: 'Por favor completa tu nombre, número de WhatsApp y el mensaje de tu requerimiento para que podamos atenderte.' },
        { status: 400 }
      );
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticket_number = `TICK-${new Date().getFullYear()}-${randomSuffix}`;

    // Si viene adjunto (imagen, Excel o documento) en base64, subirlo a Supabase Storage
    let storedImageUrl: string | null = null;
    if (image_data && typeof image_data === 'string' && image_data.startsWith('data:')) {
      storedImageUrl = await uploadAttachmentToStorage(image_data, ticket_number);
    }

    const admin = getAdminClient();

    const { data: ticket, error } = await admin
      .from('support_tickets')
      .insert({
        ticket_number,
        tenant_id: tenant_id || null,
        sender_name: sender_name.trim(),
        sender_phone: sender_phone.trim(),
        sender_email: sender_email ? sender_email.trim().toLowerCase() : null,
        subject: subject ? subject.trim() : 'Soporte Técnico / Requerimiento',
        message: message.trim(),
        image_url: storedImageUrl, // Solo URL pública de Supabase Storage
        category: category || 'technical',
        status: 'open',
        priority: 'normal',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error insertando ticket:', error);
      return NextResponse.json(
        { error: 'Hubo un inconveniente temporal al registrar tu solicitud. Por favor intenta nuevamente en unos momentos.' },
        { status: 500 }
      );
    }

    // Delegar notificación exclusivamente a la Supabase Edge Function
    admin.functions
      .invoke('support-notification', {
        body: {
          ticket_number,
          sender_name: sender_name.trim(),
          sender_phone: sender_phone.trim(),
          subject: subject ? subject.trim() : 'Soporte Técnico',
          message: message.trim(),
          category: category || 'technical',
          image_url: storedImageUrl,
        },
      })
      .then(({ error: fnError }) => {
        if (fnError) {
          console.error('Error invocando Edge Function support-notification:', fnError);
        }
      })
      .catch((e) => console.error('Fallo de red invocando Edge Function:', e));

    return NextResponse.json({ success: true, ticket });
  } catch (err: unknown) {
    console.error('Error procesando ticket:', err);
    return NextResponse.json(
      { error: 'No pudimos procesar tu solicitud en este momento. Por favor verifica tu conexión e intenta nuevamente.' },
      { status: 500 }
    );
  }
}
