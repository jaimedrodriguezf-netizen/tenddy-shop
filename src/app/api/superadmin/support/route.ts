import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';

// Helper autenticación superadmin
async function checkSuperadminAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tenddy_superadmin_session');
  return sessionCookie?.value === 'authenticated';
}

// 1. Listar tickets para Superadmin
export async function GET() {
  try {
    if (!(await checkSuperadminAuth())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: tickets, error } = await admin
      .from('support_tickets')
      .select('*, tenants(name, slug)')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, tickets: tickets || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. Actualizar estado de ticket (Resolver, Cerrar, Agregar notas)
export async function PATCH(request: Request) {
  try {
    if (!(await checkSuperadminAuth())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id, status, admin_notes } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: updated, error } = await admin
      .from('support_tickets')
      .update({
        status,
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, ticket: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
