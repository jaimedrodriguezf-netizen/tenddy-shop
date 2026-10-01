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
    const clientIp = getClientIp(request);

    // Rate limit: máximo 5 tickets cada 10 min por IP
    const { isAllowed } = checkRateLimit(`ticket_${clientIp}`, {
      windowMs: 10 * 60 * 1000,
      maxRequests: 5,
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes de soporte. Por favor espera un momento.' },
        { status: 429 }
      );
    }

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

    if (!sender_name || !sender_phone || !message) {
      return NextResponse.json(
        { error: 'Nombre, teléfono y mensaje son obligatorios.' },
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
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
