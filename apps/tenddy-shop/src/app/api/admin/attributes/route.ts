import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';
import { ProductAttribute } from '@/lib/types';

// 1. OBTENER ATRIBUTOS (GET - Requiere autenticación de administrador de tienda)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Falta tenantId' }, { status: 400 });
    }

    const auth = await verifyTenantAdmin({ tenantId });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: tenant, error } = await admin
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const attributes: ProductAttribute[] = tenant.settings?.attributes || [];
    return NextResponse.json({ success: true, attributes });
  } catch (err: unknown) {
    console.error('Error en GET /api/admin/attributes:', err);
    return NextResponse.json({ error: 'Error del servidor al obtener atributos' }, { status: 500 });
  }
}

// 2. CREAR ATRIBUTO (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, name, slug: clientSlug, enable_archives, order_by, terms } = body;

    if (!tenant_id || !name) {
      return NextResponse.json({ error: 'Nombre del atributo y tenant son requeridos' }, { status: 400 });
    }

    const auth = await verifyTenantAdmin({ tenantId: tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: tenant, error: fetchErr } = await admin
      .from('tenants')
      .select('settings')
      .eq('id', tenant_id)
      .single();

    if (fetchErr || !tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    // Generar slug limpio
    let baseSlug = (clientSlug || name)
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseSlug) baseSlug = `attr-${Date.now()}`;

    const existingAttributes: ProductAttribute[] = tenant.settings?.attributes || [];

    // Evitar colisión de slug
    if (existingAttributes.some((a) => a.slug === baseSlug)) {
      baseSlug = `${baseSlug}-${Math.floor(10 + Math.random() * 90)}`;
    }

    // Parsear términos
    const parsedTerms: string[] = Array.isArray(terms)
      ? terms
      : typeof terms === 'string'
      ? terms.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const newAttribute: ProductAttribute = {
      id: `attr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      slug: baseSlug,
      enable_archives: Boolean(enable_archives),
      order_by: order_by || 'menu_order',
      terms: parsedTerms,
      created_at: new Date().toISOString(),
    };

    const updatedAttributes = [...existingAttributes, newAttribute];
    const newSettings = {
      ...(tenant.settings || {}),
      attributes: updatedAttributes,
    };

    const { error: updateErr } = await admin
      .from('tenants')
      .update({ settings: newSettings, updated_at: new Date().toISOString() })
      .eq('id', tenant_id);

    if (updateErr) {
      console.error('Error actualizando settings de atributos (POST):', updateErr);
      return NextResponse.json({ error: 'Error al registrar el atributo' }, { status: 500 });
    }

    return NextResponse.json({ success: true, attribute: newAttribute });
  } catch (err: unknown) {
    console.error('Excepción en POST /api/admin/attributes:', err);
    return NextResponse.json({ error: 'Error del servidor al procesar el atributo' }, { status: 500 });
  }
}

// 3. EDITAR ATRIBUTO (PATCH)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, id, name, slug: clientSlug, enable_archives, order_by, terms } = body;

    if (!tenant_id || !id) {
      return NextResponse.json({ error: 'Falta tenant_id o id del atributo' }, { status: 400 });
    }

    const auth = await verifyTenantAdmin({ tenantId: tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: tenant, error: fetchErr } = await admin
      .from('tenants')
      .select('settings')
      .eq('id', tenant_id)
      .single();

    if (fetchErr || !tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const existingAttributes: ProductAttribute[] = tenant.settings?.attributes || [];
    const targetIndex = existingAttributes.findIndex((a) => a.id === id);

    if (targetIndex === -1) {
      return NextResponse.json({ error: 'Atributo no encontrado' }, { status: 404 });
    }

    const currentAttribute = existingAttributes[targetIndex];

    const parsedTerms: string[] =
      terms !== undefined
        ? Array.isArray(terms)
          ? terms
          : typeof terms === 'string'
          ? terms.split(',').map((t) => t.trim()).filter(Boolean)
          : currentAttribute.terms
        : currentAttribute.terms;

    const updatedAttribute: ProductAttribute = {
      ...currentAttribute,
      name: name !== undefined ? name.trim() : currentAttribute.name,
      slug: clientSlug !== undefined && clientSlug.trim() ? clientSlug.trim() : currentAttribute.slug,
      enable_archives: enable_archives !== undefined ? Boolean(enable_archives) : currentAttribute.enable_archives,
      order_by: order_by !== undefined ? order_by : currentAttribute.order_by,
      terms: parsedTerms,
    };

    const updatedAttributes = [...existingAttributes];
    updatedAttributes[targetIndex] = updatedAttribute;

    const newSettings = {
      ...(tenant.settings || {}),
      attributes: updatedAttributes,
    };

    const { error: updateErr } = await admin
      .from('tenants')
      .update({ settings: newSettings, updated_at: new Date().toISOString() })
      .eq('id', tenant_id);

    if (updateErr) {
      console.error('Error actualizando settings de atributos (PATCH):', updateErr);
      return NextResponse.json({ error: 'Error al actualizar el atributo' }, { status: 500 });
    }

    return NextResponse.json({ success: true, attribute: updatedAttribute });
  } catch (err: unknown) {
    console.error('Excepción en PATCH /api/admin/attributes:', err);
    return NextResponse.json({ error: 'Error del servidor al editar el atributo' }, { status: 500 });
  }
}

// 4. ELIMINAR ATRIBUTO (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const attributeId = searchParams.get('attributeId');

    if (!tenantId || !attributeId) {
      return NextResponse.json({ error: 'Falta tenantId o attributeId' }, { status: 400 });
    }

    const auth = await verifyTenantAdmin({ tenantId });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: tenant, error: fetchErr } = await admin
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single();

    if (fetchErr || !tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const existingAttributes: ProductAttribute[] = tenant.settings?.attributes || [];
    const updatedAttributes = existingAttributes.filter((a) => a.id !== attributeId);

    const newSettings = {
      ...(tenant.settings || {}),
      attributes: updatedAttributes,
    };

    const { error: updateErr } = await admin
      .from('tenants')
      .update({ settings: newSettings, updated_at: new Date().toISOString() })
      .eq('id', tenantId);

    if (updateErr) {
      console.error('Error actualizando settings tras eliminar atributo (DELETE):', updateErr);
      return NextResponse.json({ error: 'Error al eliminar el atributo' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Excepción en DELETE /api/admin/attributes:', err);
    return NextResponse.json({ error: 'Error del servidor al eliminar el atributo' }, { status: 500 });
  }
}
