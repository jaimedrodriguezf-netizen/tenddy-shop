import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Función para escapar texto en HTML para Telegram
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Subir imagen base64 a Supabase Storage y devolver URL pública
async function uploadImageToStorage(
  base64DataUrl: string,
  ticketNumber: string
): Promise<{ url: string | null; buffer: Buffer | null; mimeType: string }> {
  try {
    const matches = base64DataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { url: null, buffer: null, mimeType: 'image/jpeg' };
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const filePath = `tickets/${ticketNumber}-${Date.now()}.${ext}`;

    const admin = getAdminClient();
    const { error: uploadError } = await admin.storage
      .from('support-attachments')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error subiendo imagen a Supabase Storage:', uploadError);
      return { url: null, buffer, mimeType };
    }

    const { data: publicUrlData } = admin.storage
      .from('support-attachments')
      .getPublicUrl(filePath);

    return { url: publicUrlData?.publicUrl || null, buffer, mimeType };
  } catch (err) {
    console.error('Error procesando imagen para storage:', err);
    return { url: null, buffer: null, mimeType: 'image/jpeg' };
  }
}

// Función para obtener credenciales de Telegram desde Supabase o variables de entorno
async function getTelegramConfig() {
  let botToken = process.env.TELEGRAM_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    try {
      const admin = getAdminClient();
      const { data: settings } = await admin
        .from('platform_settings')
        .select('key, value')
        .in('key', ['telegram_bot_token', 'telegram_chat_id']);

      if (settings) {
        settings.forEach((s) => {
          if (s.key === 'telegram_bot_token' && !botToken) botToken = s.value;
          if (s.key === 'telegram_chat_id' && !chatId) chatId = s.value;
        });
      }
    } catch (e) {
      console.error('Error leyendo config de Telegram en Supabase:', e);
    }
  }

  return { botToken, chatId };
}

// Función para enviar notificación y foto a Telegram vía Bot API
async function sendTelegramNotification(
  ticket: {
    ticket_number: string;
    sender_name: string;
    sender_phone: string;
    subject: string;
    message: string;
    category: string;
    image_url?: string | null;
  },
  imageBuffer?: Buffer | null,
  mimeType: string = 'image/jpeg'
) {
  const { botToken, chatId } = await getTelegramConfig();

  if (!botToken || !chatId) {
    console.warn('Telegram Bot Token o Chat ID pendientes de configuración.');
    return;
  }

  const captionHtml = 
`🚨 <b>NUEVO TICKET DE SOPORTE #${escapeHtml(ticket.ticket_number)}</b>
━━━━━━━━━━━━━━━━━━
👤 <b>De:</b> ${escapeHtml(ticket.sender_name)}
📞 <b>Teléfono:</b> ${escapeHtml(ticket.sender_phone)}
📂 <b>Categoría:</b> ${escapeHtml(ticket.category)}
📌 <b>Asunto:</b> ${escapeHtml(ticket.subject)}

📝 <b>Comentario:</b>
${escapeHtml(ticket.message)}
${ticket.image_url ? `\n📎 <b>Adjunto en Storage:</b>\n${ticket.image_url}` : ''}

🌐 <i>Enviado desde tenddy.shop</i>`;

  try {
    if (imageBuffer) {
      const uint8 = new Uint8Array(imageBuffer);
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('caption', captionHtml);
      formData.append('parse_mode', 'HTML');
      formData.append('photo', new Blob([uint8], { type: mimeType }), `${ticket.ticket_number}.jpg`);

      await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });
    } else if (ticket.image_url && ticket.image_url.startsWith('http')) {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('caption', captionHtml);
      formData.append('parse_mode', 'HTML');
      formData.append('photo', ticket.image_url);

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        // Fallback a sendMessage si sendPhoto falló por URL
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: captionHtml,
            parse_mode: 'HTML',
          }),
        });
      }
    } else {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: captionHtml,
          parse_mode: 'HTML',
        }),
      });
    }
  } catch (err) {
    console.error('Error enviando notificación a Telegram:', err);
  }
}

// 1. Enviar nuevo ticket de soporte con imagen y notificar a Telegram
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

    // Si viene imagen en base64, subirla directamente a Supabase Storage
    let storedImageUrl: string | null = null;
    let localImageBuffer: Buffer | null = null;
    let imageMime = 'image/jpeg';

    if (image_data && typeof image_data === 'string' && image_data.startsWith('data:image')) {
      const uploadRes = await uploadImageToStorage(image_data, ticket_number);
      storedImageUrl = uploadRes.url;
      localImageBuffer = uploadRes.buffer;
      imageMime = uploadRes.mimeType;
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
        image_url: storedImageUrl, // URL pública de Supabase Storage en lugar de Base64
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

    // Disparar notificación directa a Telegram con HTML seguro
    sendTelegramNotification(
      {
        ticket_number,
        sender_name: sender_name.trim(),
        sender_phone: sender_phone.trim(),
        subject: subject || 'Soporte Técnico',
        message: message.trim(),
        category: category || 'technical',
        image_url: storedImageUrl,
      },
      localImageBuffer,
      imageMime
    ).catch(console.error);

    return NextResponse.json({ success: true, ticket });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
