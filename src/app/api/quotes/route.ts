import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Detección de IP y Rate Limiting anti-bots
    // Límite: máximo 5 solicitudes de cotización por minuto por IP
    const clientIp = getClientIp(request);
    const { isAllowed } = checkRateLimit(`quote_${clientIp}`, {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 5,
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes en poco tiempo. Por favor espera un momento.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      tenant_id,
      branch_id,
      customer_name,
      company_name,
      tax_id,
      customer_phone,
      customer_email,
      delivery_city,
      delivery_address,
      notes,
      items,
      // Campo honeypot anti-spam (invisible para humanos, llenado por bots)
      _hp_check,
      // Campo timestamp para detectar envíos automáticos sobrehumanos (< 1.5 seg)
      _form_rendered_at,
    } = body;

    // 2. Trampa Honeypot: si el campo oculto tiene valor, es un bot 100% garantizado
    if (_hp_check) {
      // Respondemos OK ficticio para no alertar al bot, pero no guardamos nada en base de datos
      return NextResponse.json({ success: true, quote: { quote_number: 'COT-BOT-DETECTED' } });
    }

    // 3. Trampa de velocidad (Time-trap): un humano tarda al menos 3 a 5 segundos en llenar el formulario
    if (_form_rendered_at && typeof _form_rendered_at === 'number') {
      const timeElapsedMs = Date.now() - _form_rendered_at;
      if (timeElapsedMs < 1500) {
        // Envió en menos de 1.5 segundos -> descartado por automatización sobrehumana
        return NextResponse.json({ success: true, quote: { quote_number: 'COT-FAST-DISMISSED' } });
      }
    }

    // 4. Validación estricta de estructura
    if (!tenant_id || !customer_name || !customer_phone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios para registrar la cotización' },
        { status: 400 }
      );
    }

    // 5. Sanitización de longitudes (neutraliza payloads masivos)
    if (customer_name.length > 120 || customer_phone.length > 30) {
      return NextResponse.json({ error: 'Longitud de campos de contacto excedida' }, { status: 400 });
    }
    if (company_name && company_name.length > 150) {
      return NextResponse.json({ error: 'Razón social excede el límite permitido' }, { status: 400 });
    }
    if (notes && notes.length > 1000) {
      return NextResponse.json({ error: 'Notas exceden el límite de 1000 caracteres' }, { status: 400 });
    }
    if (items.length > 50) {
      return NextResponse.json({ error: 'Máximo 50 referencias por cotización' }, { status: 400 });
    }

    const admin = getAdminClient();

    // Generar consecutivo amigable (e.g. COT-2026-XXXX)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const quote_number = `COT-${new Date().getFullYear()}-${randomSuffix}`;

    const { data: quote, error } = await admin
      .from('quotes')
      .insert({
        tenant_id,
        branch_id: branch_id || null,
        quote_number,
        customer_name: customer_name.trim(),
        company_name: company_name ? company_name.trim() : null,
        tax_id: tax_id ? tax_id.trim() : null,
        customer_phone: customer_phone.trim(),
        customer_email: customer_email ? customer_email.trim().toLowerCase() : null,
        delivery_city: delivery_city ? delivery_city.trim() : null,
        delivery_address: delivery_address ? delivery_address.trim() : null,
        notes: notes ? notes.trim() : null,
        items,
        status: 'pending',
      })
      .select('id, quote_number, created_at')
      .single();

    if (error) {
      console.error('Error insertando cotización en Supabase:', error);
      return NextResponse.json({ error: 'Error procesando la solicitud' }, { status: 500 });
    }

    return NextResponse.json({ success: true, quote });
  } catch (err: any) {
    console.error('Excepción en /api/quotes:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
