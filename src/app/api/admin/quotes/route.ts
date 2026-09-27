import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';

// Actualizar estado de una cotización
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { quote_id, status } = body;

    if (!quote_id || !status) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Validar estados válidos permitidos
    const validStatuses = ['pending', 'contacted', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado comercial inválido' }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1. Obtener la cotización para saber a qué tenant pertenece
    const { data: targetQuote, error: fetchErr } = await admin
      .from('quotes')
      .select('id, tenant_id')
      .eq('id', quote_id)
      .single();

    if (fetchErr || !targetQuote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // 2. Validar autorización estricta para este tenant
    const auth = await verifyTenantAdmin({ tenantId: targetQuote.tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const { data, error } = await admin
      .from('quotes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', quote_id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, quote: data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
