import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Función para enviar notificación y foto a Telegram vía Bot API
async function sendTelegramNotification(ticket: {
  ticket_number: string;
  sender_name: string;
  sender_phone: string;
  subject: string;
  message: string;
  category: string;
  image_url?: string | null;
}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('Telegram Bot Token o Chat ID no configurados en variables de entorno.');
    return;
  }

  const caption = 
`🚨 *NUEVO TICKET DE SOPORTE #${ticket.ticket_number}*
━━━━━━━━━━━━━━━━━━
👤 *De:* ${ticket.sender_name}
📞 *Teléfono:* ${ticket.sender_phone}
📂 *Categoría:* ${ticket.category}
📌 *Asunto:* ${ticket.subject}

📝 *Comentario:*
${ticket.message}

🌐 _Enviado desde tenddy.shop_`;

  try {
    // Si adjuntó imagen Base64, enviarla como Photo a Telegram
    if (ticket.image_url && ticket.image_url.startsWith('data:image')) {
      const base64Data = ticket.image_url.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('caption', caption);
      formData.append('parse_mode', 'Markdown');
      formData.append('photo', new Blob([buffer], { type: 'image/jpeg' }), `${ticket.ticket_number}.jpg`);

      await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });
    } else {
      // Si no hay foto, enviar mensaje de texto normal
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: caption,
          parse_mode: 'Markdown',
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
      image_data, // Imagen en Base64
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

    const admin = getAdminClient();

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticket_number = `TICK-${new Date().getFullYear()}-${randomSuffix}`;

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
        image_url: image_data || null,
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

    // Disparar notificación directa a Telegram de forma asíncrona
    sendTelegramNotification({
      ticket_number,
      sender_name: sender_name.trim(),
      sender_phone: sender_phone.trim(),
      subject: subject || 'Soporte Técnico',
      message: message.trim(),
      category: category || 'technical',
      image_url: image_data || null,
    }).catch(console.error);

    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
