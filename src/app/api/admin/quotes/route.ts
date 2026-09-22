import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';

// Actualizar estado de una cotización
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { quote_id, status, shopSlug } = body;

    if (!quote_id || !status) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Validar autorización de sesión
    const cookieStore = await cookies();
    const hasAuthCookie = Array.from(cookieStore.getAll()).some(
      (c) => c.name.startsWith('admin_session_') && c.value === 'authenticated'
    );

    if (!hasAuthCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Validar estados válidos permitidos
    const validStatuses = ['pending', 'contacted', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado comercial inválido' }, { status: 400 });
    }

    const admin = getAdminClient();
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
