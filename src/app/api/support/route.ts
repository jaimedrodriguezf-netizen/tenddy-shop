import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// 1. Enviar nuevo ticket de soporte con imagen
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate limit: máximo 5 tickets cada 10 min por IP para evitar spam
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
      image_data, // Imagen en Base64 o URL
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

    // Generar consecutivo amigable
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

    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
