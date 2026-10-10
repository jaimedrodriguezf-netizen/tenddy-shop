import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';
import { ProductTag } from '@/lib/types';

// 1. OBTENER ETIQUETAS (GET - Requiere autenticación de administrador de tienda)
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

    const tags: ProductTag[] = tenant.settings?.tags || [];
    return NextResponse.json({ success: true, tags });
  } catch (err: unknown) {
    console.error('Error en GET /api/admin/tags:', err);
    return NextResponse.json({ error: 'Error del servidor al obtener etiquetas' }, { status: 500 });
  }
}

// 2. CREAR ETIQUETA (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, name, slug: clientSlug, description } = body;

    if (!tenant_id || !name) {
      return NextResponse.json({ error: 'Nombre de la etiqueta y tenant son requeridos' }, { status: 400 });
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

    if (!baseSlug) baseSlug = `tag-${Date.now()}`;

    const existingTags: ProductTag[] = tenant.settings?.tags || [];

    // Evitar colisión de slug
    if (existingTags.some((t) => t.slug === baseSlug)) {
      baseSlug = `${baseSlug}-${Math.floor(10 + Math.random() * 90)}`;
    }

    const newTag: ProductTag = {
      id: `tag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      slug: baseSlug,
      description: description ? description.trim() : undefined,
      created_at: new Date().toISOString(),
    };

    const updatedTags = [...existingTags, newTag];
    const newSettings = {
      ...(tenant.settings || {}),
      tags: updatedTags,
    };

    const { error: updateErr } = await admin
      .from('tenants')
      .update({ settings: newSettings, updated_at: new Date().toISOString() })
      .eq('id', tenant_id);

    if (updateErr) {
      console.error('Error actualizando settings de etiquetas (POST):', updateErr);
      return NextResponse.json({ error: 'Error al registrar la etiqueta' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tag: newTag });
  } catch (err: unknown) {
    console.error('Excepción en POST /api/admin/tags:', err);
    return NextResponse.json({ error: 'Error del servidor al procesar la etiqueta' }, { status: 500 });
  }
}

// 3. EDITAR ETIQUETA (PATCH)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, id, name, slug: clientSlug, description } = body;

    if (!tenant_id || !id) {
      return NextResponse.json({ error: 'Falta tenant_id o id de la etiqueta' }, { status: 400 });
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

    const existingTags: ProductTag[] = tenant.settings?.tags || [];
    const targetIndex = existingTags.findIndex((t) => t.id === id);

    if (targetIndex === -1) {
      return NextResponse.json({ error: 'Etiqueta no encontrada' }, { status: 404 });
    }

    const currentTag = existingTags[targetIndex];

    const updatedTag: ProductTag = {
      ...currentTag,
      name: name !== undefined ? name.trim() : currentTag.name,
      slug: clientSlug !== undefined && clientSlug.trim() ? clientSlug.trim() : currentTag.slug,
      description: description !== undefined ? (description ? description.trim() : undefined) : currentTag.description,
    };

    const updatedTags = [...existingTags];
    updatedTags[targetIndex] = updatedTag;

    const newSettings = {
      ...(tenant.settings || {}),
      tags: updatedTags,
    };

    const { error: updateErr } = await admin
      .from('tenants')
      .update({ settings: newSettings, updated_at: new Date().toISOString() })
      .eq('id', tenant_id);

    if (updateErr) {
      console.error('Error actualizando settings de etiquetas (PATCH):', updateErr);
      return NextResponse.json({ error: 'Error al actualizar la etiqueta' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tag: updatedTag });
  } catch (err: unknown) {
    console.error('Excepción en PATCH /api/admin/tags:', err);
    return NextResponse.json({ error: 'Error del servidor al editar la etiqueta' }, { status: 500 });
  }
}

// 4. ELIMINAR ETIQUETA (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const tagId = searchParams.get('tagId');

    if (!tenantId || !tagId) {
      return NextResponse.json({ error: 'Falta tenantId o tagId' }, { status: 400 });
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

    const existingTags: ProductTag[] = tenant.settings?.tags || [];
    const updatedTags = existingTags.filter((t) => t.id !== tagId);

    const newSettings = {
      ...(tenant.settings || {}),
      tags: updatedTags,
    };

    const { error: updateErr } = await admin
      .from('tenants')
      .update({ settings: newSettings, updated_at: new Date().toISOString() })
      .eq('id', tenantId);

    if (updateErr) {
      console.error('Error actualizando settings tras eliminar etiqueta (DELETE):', updateErr);
      return NextResponse.json({ error: 'Error al eliminar la etiqueta' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Excepción en DELETE /api/admin/tags:', err);
    return NextResponse.json({ error: 'Error del servidor al eliminar la etiqueta' }, { status: 500 });
  }
}
