import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';
import { verifySuperadminToken } from '@/lib/session';

// Helper para validar sesión de superadmin con firma criptográfica
async function checkSuperadminAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tenddy_superadmin_session');
  return verifySuperadminToken(sessionCookie?.value);
}

// 1. OBTENER USUARIOS (Compradores B2B y Miembros de Fábricas)
export async function GET(request: Request) {
  try {
    if (!(await checkSuperadminAuth())) {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'buyers'; // "buyers" o "staff"

    const admin = getAdminClient();

    if (type === 'buyers') {
      const { data: buyers, error } = await admin
        .from('b2b_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, users: buyers || [] });
    } else {
      const { data: staff, error } = await admin
        .from('tenant_members')
        .select('*, tenants(name, slug)')
        .order('created_at', { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, users: staff || [] });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. CREAR USUARIO / COMPRADOR B2B DESDE SUPERADMIN
export async function POST(request: Request) {
  try {
    if (!(await checkSuperadminAuth())) {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const body = await request.json();
    const { company_name, tax_id, phone, email, billing_city, billing_address } = body;

    if (!company_name || !email || !phone) {
      return NextResponse.json({ error: 'Empresa, email y teléfono son obligatorios' }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: newBuyer, error } = await admin
      .from('b2b_accounts')
      .insert({
        company_name: company_name.trim(),
        tax_id: tax_id ? tax_id.trim() : null,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        billing_city: billing_city ? billing_city.trim() : null,
        billing_address: billing_address ? billing_address.trim() : null,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, user: newBuyer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. EDITAR / SUSPENDER USUARIO
export async function PATCH(request: Request) {
  try {
    if (!(await checkSuperadminAuth())) {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const body = await request.json();
    const { id, is_active, company_name, phone, billing_city, type } = body;

    if (!id) return NextResponse.json({ error: 'Falta ID de usuario' }, { status: 400 });

    const admin = getAdminClient();
    const table = type === 'staff' ? 'tenant_members' : 'b2b_accounts';

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof is_active === 'boolean') updatePayload.is_active = is_active;
    if (company_name) updatePayload.company_name = company_name.trim();
    if (phone) updatePayload.phone = phone.trim();
    if (billing_city) updatePayload.billing_city = billing_city.trim();

    const { data: updated, error } = await admin
      .from(table)
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. ELIMINAR USUARIO
export async function DELETE(request: Request) {
  try {
    if (!(await checkSuperadminAuth())) {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'buyers';

    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    const admin = getAdminClient();
    const table = type === 'staff' ? 'tenant_members' : 'b2b_accounts';

    const { error } = await admin.from(table).delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
