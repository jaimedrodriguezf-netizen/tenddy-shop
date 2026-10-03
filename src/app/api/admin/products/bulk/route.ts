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

    if (products.length > 3000) {
      return NextResponse.json(
        { error: 'Límite de 3000 productos por carga masiva excedido' },
        { status: 400 }
      );
    }

    // 1. Validar autorización estricta del tenant
    const auth = await verifyTenantAdmin({ tenantId: tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();

    // 2. Cargar SKUs existentes para detectar y omitir productos duplicados (Ticket #4603)
    const { data: existingProducts } = await admin
      .from('products')
      .select('sku')
      .eq('tenant_id', tenant_id);

    const existingSkuSet = new Set(
      (existingProducts || []).map((p) => p.sku?.toUpperCase().trim()).filter(Boolean)
    );

    // 3. Cargar categorías existentes para este tenant
    const { data: existingCategories } = await admin
      .from('categories')
      .select('id, name, slug')
      .eq('tenant_id', tenant_id);

    const categoryMap = new Map<string, string>();
    (existingCategories || []).forEach((c) => {
      categoryMap.set(c.name.toLowerCase().trim(), c.id);
    });

    // 4. Identificar categorías nuevas necesarias y crearlas automáticamente
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

    // 5. Preparar payload masivo de productos omitiendo duplicados
    const seenBatchSkus = new Set<string>();
    let duplicateRowsCount = 0;
    const productsToInsert = [];

    for (let idx = 0; idx < products.length; idx++) {
      const p = products[idx];
      const rawSku = p.sku ? p.sku.trim().toUpperCase() : '';

      // Si el SKU ya existe en la base de datos o en este mismo archivo, omitir para no duplicar
      if (rawSku && (existingSkuSet.has(rawSku) || seenBatchSkus.has(rawSku))) {
        duplicateRowsCount++;
        continue;
      }

      if (rawSku) {
        seenBatchSkus.add(rawSku);
      }

      const effectiveSku = rawSku || `SKU-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const rawName = p.name ? p.name.trim() : `Prenda ${idx + 1}`;

      const baseSlug = rawName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 30);

      const cleanSkuPart = effectiveSku.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
      const uniqueSuffix = `${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`;
      const slug = `${baseSlug}-${cleanSkuPart}-${uniqueSuffix}`;

      const catId = p.category_name ? categoryMap.get(p.category_name.toLowerCase().trim()) : null;

      const specs: Record<string, string> = {};
      if (p.color) specs.color = p.color.trim();
      if (p.tallas) specs.tallas = p.tallas.trim();
      if (p.detalles_patronaje) specs.costuras_patronaje = p.detalles_patronaje.trim();

      const imageArray = p.image_url && p.image_url.startsWith('http')
        ? [p.image_url.trim()]
        : ['/assets/products/ayme-001.svg'];

      productsToInsert.push({
        tenant_id,
        category_id: catId || null,
        slug,
        name: rawName,
        sku: effectiveSku,
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
      });
    }

    if (productsToInsert.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        skippedDuplicates: duplicateRowsCount,
        newCategoriesCount: uniqueCategoryNames.size,
        message: `Todos los ${duplicateRowsCount} productos del archivo ya estaban subidos en tu catálogo. No se duplicó ningún diseño repetido.`,
        products: [],
      });
    }

    // 5. Inserción masiva en Supabase por lotes (chunks de 100) para soportar 2000+ productos sin timeouts
    const CHUNK_SIZE = 100;
    const insertedProducts: unknown[] = [];

    for (let i = 0; i < productsToInsert.length; i += CHUNK_SIZE) {
      const chunk = productsToInsert.slice(i, i + CHUNK_SIZE);
      const { data: insertedChunk, error: insertError } = await admin
        .from('products')
        .insert(chunk)
        .select('*');

      if (insertError) {
        console.error(`Error en carga masiva lote ${Math.floor(i / CHUNK_SIZE) + 1}:`, insertError);
        return NextResponse.json(
          {
            error: `Error en lote ${Math.floor(i / CHUNK_SIZE) + 1} (${insertError.message})`,
            insertedBeforeError: insertedProducts.length,
          },
          { status: 500 }
        );
      }

      if (insertedChunk) {
        insertedProducts.push(...insertedChunk);
      }
    }

    const message = duplicateRowsCount > 0
      ? `Se importaron ${insertedProducts.length} productos nuevos. Se omitieron ${duplicateRowsCount} productos repetidos para no duplicar tu catálogo.`
      : `¡${insertedProducts.length} productos importados exitosamente! Se crearon ${uniqueCategoryNames.size} nuevas categorías.`;

    return NextResponse.json({
      success: true,
      count: insertedProducts.length,
      skippedDuplicates: duplicateRowsCount,
      newCategoriesCount: uniqueCategoryNames.size,
      products: insertedProducts,
      message,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
