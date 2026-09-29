import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';

interface BulkProductRow {
  name: string;
  sku: string;
  category_name?: string;
  description?: string;
  color?: string;
  tallas?: string;
  detalles_patronaje?: string;
  image_url?: string;
  min_order_qty?: number;
  units_per_package?: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, products } = body;

    if (!tenant_id || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Tenant ID y lista de productos son requeridos' },
        { status: 400 }
      );
    }

    if (products.length > 500) {
      return NextResponse.json(
        { error: 'Límite de 500 productos por carga masiva excedido' },
        { status: 400 }
      );
    }

    // 1. Validar autorización estricta del tenant
    const auth = await verifyTenantAdmin({ tenantId: tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();

    // 2. Cargar categorías existentes para este tenant
    const { data: existingCategories } = await admin
      .from('categories')
      .select('id, name, slug')
      .eq('tenant_id', tenant_id);

    const categoryMap = new Map<string, string>();
    (existingCategories || []).forEach((c) => {
      categoryMap.set(c.name.toLowerCase().trim(), c.id);
    });

    // 3. Identificar categorías nuevas necesarias y crearlas automáticamente
    const uniqueCategoryNames = new Set<string>();
    products.forEach((p: BulkProductRow) => {
      const catName = p.category_name?.trim();
      if (catName && !categoryMap.has(catName.toLowerCase())) {
        uniqueCategoryNames.add(catName);
      }
    });

    for (const newCatName of uniqueCategoryNames) {
      const catSlug = newCatName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;

      const { data: createdCat } = await admin
        .from('categories')
        .insert({
          tenant_id,
          name: newCatName,
          slug: `${catSlug}-${Math.floor(10 + Math.random() * 90)}`,
          is_active: true,
        })
        .select('id, name')
        .single();

      if (createdCat) {
        categoryMap.set(createdCat.name.toLowerCase().trim(), createdCat.id);
      }
    }

    // 4. Preparar payload masivo de productos
    const productsToInsert = products.map((p: BulkProductRow, idx: number) => {
      const rawName = p.name ? p.name.trim() : `Prenda ${idx + 1}`;
      const rawSku = p.sku ? p.sku.trim().toUpperCase() : `SKU-${Date.now()}-${idx + 1}`;

      const baseSlug = rawName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 30);

      const cleanSkuPart = rawSku.toLowerCase().replace(/[^a-z0-9]/g, '');
      const slug = `${baseSlug}-${cleanSkuPart}-${Math.floor(10 + Math.random() * 90)}`;

      const catId = p.category_name ? categoryMap.get(p.category_name.toLowerCase().trim()) : null;

      const specs: Record<string, string> = {};
      if (p.color) specs.color = p.color.trim();
      if (p.tallas) specs.tallas = p.tallas.trim();
      if (p.detalles_patronaje) specs.costuras_patronaje = p.detalles_patronaje.trim();

      const imageArray = p.image_url && p.image_url.startsWith('http')
        ? [p.image_url.trim()]
        : ['/assets/products/ayme-001.svg'];

      return {
        tenant_id,
        category_id: catId || null,
        slug,
        name: rawName,
        sku: rawSku,
        description: p.description ? p.description.trim() : null,
        min_order_qty: Number(p.min_order_qty) || 12,
        units_per_package: Number(p.units_per_package) || 12,
        attributes: {
          specs,
          badge: 'Mayorista',
        },
        images: imageArray,
        price_tiers: [],
        is_active: true,
      };
    });

    // 5. Inserción masiva en Supabase
    const { data: inserted, error: insertError } = await admin
      .from('products')
      .insert(productsToInsert)
      .select('*');

    if (insertError) {
      console.error('Error en carga masiva de productos:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: inserted?.length || 0,
      newCategoriesCount: uniqueCategoryNames.size,
      products: inserted || [],
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
