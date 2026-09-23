import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';

// Obtener o crear productos desde el panel administrativo
export async function POST(request: Request) {
  try {
    // 1. Validar autenticación de sesión
    const cookieStore = await cookies();
    const hasAuthCookie = Array.from(cookieStore.getAll()).some(
      (c) => c.name.startsWith('admin_session_') && c.value === 'authenticated'
    );

    if (!hasAuthCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tenant_id,
      category_id,
      name,
      sku,
      description,
      min_order_qty,
      units_per_package,
      attributes,
      images,
      price_tiers,
    } = body;

    if (!tenant_id || !name || !sku) {
      return NextResponse.json(
        { error: 'El nombre, SKU y tenant son obligatorios' },
        { status: 400 }
      );
    }

    // Generar slug URL-friendly
    const slug = name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const admin = getAdminClient();

    const { data: product, error } = await admin
      .from('products')
      .insert({
        tenant_id,
        category_id: category_id || null,
        slug: `${slug}-${sku.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        description: description ? description.trim() : null,
        min_order_qty: Number(min_order_qty) || 1,
        units_per_package: Number(units_per_package) || 1,
        attributes: attributes || {},
        images: images && images.length > 0 ? images : ['/assets/products/ayme-001.svg'],
        price_tiers: price_tiers || [],
        is_active: true,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creando producto:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}

// Eliminar producto
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const hasAuthCookie = Array.from(cookieStore.getAll()).some(
      (c) => c.name.startsWith('admin_session_') && c.value === 'authenticated'
    );

    if (!hasAuthCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Falta productId' }, { status: 400 });
    }

    const admin = getAdminClient();
    const { error } = await admin.from('products').delete().eq('id', productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
