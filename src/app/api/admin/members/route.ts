import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';

// Función criptográfica estándar OWASP para hashing con salt (PBKDF2-SHA512)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

// Listar miembros del equipo de la fábrica
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Falta tenantId' }, { status: 400 });
    }

    // 1. Validar autorización estricta para este tenant
    const auth = await verifyTenantAdmin({ tenantId });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
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

    // 1. Validar autorización estricta para este tenant
    const auth = await verifyTenantAdmin({ tenantId: tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
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
        password_hash: hashPassword(password || 'temp_123456'),
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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
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

    // 1. Obtener el tenant al que pertenece el miembro antes de borrarlo
    const { data: targetMember, error: fetchErr } = await admin
      .from('tenant_members')
      .select('id, tenant_id')
      .eq('id', memberId)
      .single();

    if (fetchErr || !targetMember) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
    }

    // 2. Validar autorización estricta para este tenant
    const auth = await verifyTenantAdmin({ tenantId: targetMember.tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const { error } = await admin.from('tenant_members').delete().eq('id', memberId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
