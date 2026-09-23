import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';

// Listar miembros del equipo de la fábrica
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Falta tenantId' }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: members, error } = await admin
      .from('tenant_members')
      .select('id, full_name, email, phone, role, is_active, created_at, branch_id')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, members: members || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Agregar nuevo miembro (Dueño, Admin o Vendedor)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, branch_id, full_name, email, phone, role, password } = body;

    if (!tenant_id || !full_name || !email || !role) {
      return NextResponse.json(
        { error: 'Nombre, correo, rol y tenant son requeridos' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    const { data: member, error } = await admin
      .from('tenant_members')
      .insert({
        tenant_id,
        branch_id: branch_id || null,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        password_hash: password || 'temp_123456',
        role,
        is_active: true,
      })
      .select('id, full_name, email, phone, role, is_active, branch_id')
      .single();

    if (error) {
      console.error('Error insertando miembro:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, member });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Eliminar o desactivar miembro
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'Falta memberId' }, { status: 400 });
    }

    const admin = getAdminClient();
    const { error } = await admin.from('tenant_members').delete().eq('id', memberId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
