import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
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
      // Campo honeypot anti-spam para atrapar bots automáticos
      _hp_check,
    } = body;

    // 1. Si un bot llena el campo honeypot, rechazamos silenciosamente
    if (_hp_check) {
      return NextResponse.json({ success: true, quote: { quote_number: 'COT-SPAM' } });
    }

    // 2. Validación de campos obligatorios
    if (!tenant_id || !customer_name || !customer_phone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios para registrar la cotización' },
        { status: 400 }
      );
    }

    // 3. Sanitización y validación de longitudes (Protección contra Payloads maliciosos)
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
