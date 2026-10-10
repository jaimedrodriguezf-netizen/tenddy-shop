import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';
import { hashPassword } from '@/lib/passwords';

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
      console.error('Error consultando miembros de la tienda (GET):', error);
      return NextResponse.json({ error: 'No se pudieron consultar los miembros del equipo' }, { status: 500 });
    }

    return NextResponse.json({ success: true, members: members || [] });
  } catch (err: unknown) {
    console.error('Excepción en GET /api/admin/members:', err);
    return NextResponse.json({ error: 'Error del servidor al obtener miembros' }, { status: 500 });
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
      console.error('Error insertando miembro (POST):', error);
      return NextResponse.json({ error: 'No se pudo agregar el miembro al equipo' }, { status: 500 });
    }

    return NextResponse.json({ success: true, member });
  } catch (err: unknown) {
    console.error('Excepción en POST /api/admin/members:', err);
    return NextResponse.json({ error: 'Error del servidor al registrar miembro' }, { status: 500 });
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
      console.error('Error eliminando miembro (DELETE):', error);
      return NextResponse.json({ error: 'No se pudo eliminar el miembro del equipo' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Excepción en DELETE /api/admin/members:', err);
    return NextResponse.json({ error: 'Error del servidor al eliminar miembro' }, { status: 500 });
  }
}

// 4. Actualizar miembro del equipo (roles, sucursal, contraseña)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, tenant_id, full_name, phone, role, password, is_active, branch_id } = body;

    if (!id || !tenant_id) {
      return NextResponse.json({ error: 'Falta id o tenant_id' }, { status: 400 });
    }

    const auth = await verifyTenantAdmin({ tenantId: tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();
    const updateData: Record<string, unknown> = {};

    if (full_name) updateData.full_name = full_name.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (role) updateData.role = role;
    if (branch_id !== undefined) updateData.branch_id = branch_id || null;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      updateData.password_hash = hashPassword(password.trim());
    }

    const { data: updatedMember, error: updateErr } = await admin
      .from('tenant_members')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select('id, full_name, email, phone, role, is_active, branch_id')
      .single();

    if (updateErr) {
      console.error('Error actualizando miembro (PATCH):', updateErr);
      return NextResponse.json({ error: 'No se pudo actualizar el miembro del equipo' }, { status: 500 });
    }

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (err: unknown) {
    console.error('Excepción en PATCH /api/admin/members:', err);
    return NextResponse.json({ error: 'Error del servidor al actualizar miembro' }, { status: 500 });
  }
}
