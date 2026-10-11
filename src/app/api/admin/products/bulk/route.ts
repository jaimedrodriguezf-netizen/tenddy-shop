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
  images?: string[];
  price?: number | null;
  sale_price?: number | null;
  stock?: number | null;
  min_order_qty?: number;
  units_per_package?: number;
  update_if_exists?: boolean;
}

function normalizeImageUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim();

  // 1. Google Drive: transformar y optimizar compresión con CDN a 800px WebP (=w800)
  if (clean.includes('drive.google.com') || clean.includes('docs.google.com')) {
    const match = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}=w800`;
    }
  }

  // 2. Si ya es una URL de Google lh3 sin tamaño, forzar compresión =w800
  if (clean.includes('lh3.googleusercontent.com/d/') && !clean.includes('=')) {
    clean = `${clean}=w800`;
  }

  // 3. Unsplash: forzar compresión y formato óptimo WebP
  if (clean.includes('images.unsplash.com') && !clean.includes('auto=format')) {
    clean = clean.includes('?') ? `${clean}&auto=format&q=80&w=800` : `${clean}?auto=format&q=80&w=800`;
  }

  // 4. Dropbox (transformar a enlace directo de imagen)
  if (clean.includes('dropbox.com')) {
    clean = clean.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/[?&]dl=0/, '');
  }

  // 5. Forzar HTTPS para evitar bloqueos por Mixed Content
  if (clean.startsWith('http://')) {
    clean = clean.replace('http://', 'https://');
  }

  return clean;
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

    // 2. Cargar SKUs existentes para detectar duplicados o actualizar (Ticket #4603)
    const { data: existingProducts } = await admin
      .from('products')
      .select('id, sku, attributes')
      .eq('tenant_id', tenant_id);

    const existingProductMap = new Map<string, { id: string; attributes: any }>();
    (existingProducts || []).forEach((p) => {
      if (p.sku) existingProductMap.set(p.sku.toUpperCase().trim(), p);
    });

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

    // Crear categorías nuevas en un solo lote atómico
    if (uniqueCategoryNames.size > 0) {
      const categoriesPayload = Array.from(uniqueCategoryNames).map((newCatName) => {
        const catSlug = newCatName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;

        return {
          tenant_id,
          name: newCatName,
          slug: `${catSlug}-${Math.floor(10 + Math.random() * 90)}`,
          is_active: true,
        };
      });

      const { data: createdCats } = await admin
        .from('categories')
        .insert(categoriesPayload)
        .select('id, name');

      if (createdCats) {
        for (const c of createdCats) {
          categoryMap.set(c.name.toLowerCase().trim(), c.id);
        }
      }
    }

    // 5. Preparar payload masivo de productos (nuevos y actualizaciones)
    const seenBatchSkus = new Set<string>();
    let duplicateRowsCount = 0;
    let updatedProductsCount = 0;
    const productsToInsert = [];
    const productsToUpdate = [];

    for (let idx = 0; idx < products.length; idx++) {
      const p = products[idx];
      const rawSku = p.sku ? p.sku.trim().toUpperCase() : '';
      const catId = p.category_name ? categoryMap.get(p.category_name.toLowerCase().trim()) : null;

      // Extraer y normalizar imágenes (soporta una o múltiples URLs separadas por coma, punto y coma, o saltos de línea)
      const imageArray: string[] = [];
      const rawImageValues: string[] = [];
      if (Array.isArray(p.images) && p.images.length > 0) {
        rawImageValues.push(...p.images);
      } else if (p.image_url) {
        rawImageValues.push(p.image_url);
      }

      for (const rawVal of rawImageValues) {
        if (!rawVal) continue;
        const tokens = String(rawVal).split(/[\r\n,;]+/).map((t) => t.trim()).filter(Boolean);
        for (const token of tokens) {
          if (imageArray.length >= 8) break; // Límite estricto: máximo 8 imágenes por producto
          const cleanUrl = normalizeImageUrl(token);
          if (cleanUrl.startsWith('https://') || cleanUrl.startsWith('http://')) {
            imageArray.push(cleanUrl);
          }
        }
      }

      // Si el SKU ya existe en la base de datos
      if (rawSku && existingProductMap.has(rawSku)) {
        if (p.update_if_exists) {
          const existing = existingProductMap.get(rawSku)!;
          const updateData: Record<string, any> = {
            id: existing.id,
            name: p.name.trim(),
            description: p.description ? p.description.trim() : null,
          };
          if (catId) updateData.category_id = catId;
          if (imageArray.length > 0) updateData.images = imageArray;
          if (p.price !== undefined && p.price !== null) updateData.price = Number(p.price);
          if (p.stock !== undefined && p.stock !== null) updateData.stock = Number(p.stock);

          productsToUpdate.push(updateData);
        } else {
          duplicateRowsCount++;
        }
        continue;
      }

      if (rawSku && seenBatchSkus.has(rawSku)) {
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

      const specs: Record<string, string> = {};
      if (p.color) specs.color = p.color.trim();
      if (p.tallas) specs.tallas = p.tallas.trim();
      if (p.detalles_patronaje) specs.costuras_patronaje = p.detalles_patronaje.trim();

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

    // Ejecutar actualizaciones concurrentes en lotes de 25 para evitar bloqueos y timeouts en serverless
    const UPDATE_CHUNK_SIZE = 25;
    for (let i = 0; i < productsToUpdate.length; i += UPDATE_CHUNK_SIZE) {
      const updateChunk = productsToUpdate.slice(i, i + UPDATE_CHUNK_SIZE);
      const results = await Promise.allSettled(
        updateChunk.map((up) => {
          const { id, ...dataToUpdate } = up;
          return admin.from('products').update(dataToUpdate).eq('id', id);
        })
      );
      for (const res of results) {
        if (res.status === 'fulfilled' && !res.value.error) {
          updatedProductsCount++;
        }
      }
    }

    // 6. Inserción masiva en Supabase por lotes (chunks de 100) para soportar 2000+ productos sin timeouts
    const CHUNK_SIZE = 100;
    const insertedProducts: any[] = [];

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
            error: `Error procesando el lote ${Math.floor(i / CHUNK_SIZE) + 1} de la carga masiva`,
            insertedBeforeError: insertedProducts.length,
          },
          { status: 500 }
        );
      }

      if (insertedChunk) {
        insertedProducts.push(...insertedChunk);
      }
    }

    const message = updatedProductsCount > 0
      ? `Se importaron ${insertedProducts.length} productos nuevos y se actualizaron ${updatedProductsCount} existentes.`
      : duplicateRowsCount > 0
      ? `Se importaron ${insertedProducts.length} productos nuevos. Se omitieron ${duplicateRowsCount} productos repetidos para no duplicar tu catálogo.`
      : `¡${insertedProducts.length} productos importados exitosamente! Se crearon ${uniqueCategoryNames.size} nuevas categorías.`;

    return NextResponse.json({
      success: true,
      count: insertedProducts.length + updatedProductsCount,
      insertedCount: insertedProducts.length,
      updatedCount: updatedProductsCount,
      skippedDuplicates: duplicateRowsCount,
      newCategoriesCount: uniqueCategoryNames.size,
      message,
      products: insertedProducts,
    });
  } catch (err: unknown) {
    console.error('Error procesando carga masiva de productos:', err);
    return NextResponse.json(
      { error: 'Error inesperado durante la carga masiva de productos' },
      { status: 500 }
    );
  }
}
