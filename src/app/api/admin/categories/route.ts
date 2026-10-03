import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (!tenantId) {
      return NextResponse.json({ error: 'Falta tenantId' }, { status: 400 });
    }

    const admin = getAdminClient();
    let query = admin
      .from('categories')
      .select('*, products:products(count)')
      .eq('tenant_id', tenantId);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: categories, error } = await query.order('sort_order', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, categories: categories || [] });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, name, description, icon_name } = body;

    if (!tenant_id || !name) {
      return NextResponse.json({ error: 'Nombre de la categoría y tenant son requeridos' }, { status: 400 });
    }

    // 1. Validar autorización estricta del tenant
    const auth = await verifyTenantAdmin({ tenantId: tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    // Generar slug limpio
    let slug = name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) slug = `cat-${Date.now()}`;

    const admin = getAdminClient();

    // Comprobar si ya existe con este slug
    const { data: existing } = await admin
      .from('categories')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('slug', slug)
      .single();

    if (existing) {
      slug = `${slug}-${Math.floor(10 + Math.random() * 90)}`;
    }

    const { data: category, error } = await admin
      .from('categories')
      .insert({
        tenant_id,
        name: name.trim(),
        slug,
        description: description ? description.trim() : null,
        icon_name: icon_name || 'tag',
        is_active: true,
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, category });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, is_active, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Falta id de la categoría' }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1. Obtener categoría actual para validar tenant
    const { data: currentCat, error: fetchErr } = await admin
      .from('categories')
      .select('id, tenant_id, name, slug')
      .eq('id', id)
      .single();

    if (fetchErr || !currentCat) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    const auth = await verifyTenantAdmin({ tenantId: currentCat.tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const updatePayload: Record<string, unknown> = {};

    if (name !== undefined && name.trim()) {
      updatePayload.name = name.trim();
      // Si el nombre cambió, actualizar el slug
      if (name.trim() !== currentCat.name) {
        let baseSlug = name
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        if (!baseSlug) baseSlug = `cat-${Date.now()}`;
        updatePayload.slug = `${baseSlug}-${Math.floor(10 + Math.random() * 90)}`;
      }
    }

    if (description !== undefined) {
      updatePayload.description = description ? description.trim() : null;
    }

    if (is_active !== undefined) {
      updatePayload.is_active = Boolean(is_active);
    }

    if (sort_order !== undefined) {
      updatePayload.sort_order = Number(sort_order) || 0;
    }

    const { data: updatedCategory, error: updateErr } = await admin
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .select('*, products:products(count)')
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: updatedCategory });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ error: 'Falta categoryId' }, { status: 400 });
    }

    const admin = getAdminClient();

    const { data: category, error: fetchErr } = await admin
      .from('categories')
      .select('id, tenant_id')
      .eq('id', categoryId)
      .single();

    if (fetchErr || !category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    const auth = await verifyTenantAdmin({ tenantId: category.tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    // Desvincular productos asociados antes de eliminar la categoría
    await admin
      .from('products')
      .update({ category_id: null })
      .eq('category_id', categoryId);

    const { error } = await admin.from('categories').delete().eq('id', categoryId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
