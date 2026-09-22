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
    } = body;

    if (!tenant_id || !customer_name || !customer_phone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios para registrar la cotización' },
        { status: 400 }
      );
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
        customer_name,
        company_name: company_name || null,
        tax_id: tax_id || null,
        customer_phone,
        customer_email: customer_email || null,
        delivery_city: delivery_city || null,
        delivery_address: delivery_address || null,
        notes: notes || null,
        items,
        status: 'pending',
      })
      .select('id, quote_number, created_at')
      .single();

    if (error) {
      console.error('Error insertando cotización en Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, quote });
  } catch (err: any) {
    console.error('Excepción en /api/quotes:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
