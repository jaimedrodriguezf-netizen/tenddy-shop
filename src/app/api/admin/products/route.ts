import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getPlanBySlug, checkPlanLimit } from '@/lib/plans';

// Validación de Magic Bytes binarios para prevenir MIME-spoofing en subidas de fotos
function isValidImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A
    );
  }
  if (mimeType === 'image/webp') {
    return (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    );
  }
  if (mimeType === 'image/gif') {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38 &&
      (buffer[4] === 0x37 || buffer[4] === 0x39) &&
      buffer[5] === 0x61
    );
  }
  return true;
}

// 1. CREAR PRODUCTO (POST)
export async function POST(request: Request) {
  try {
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

    // Validar autorización estricta para este tenant específico
    const auth = await verifyTenantAdmin({ tenantId: tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();

    // Validar límite de productos según el plan comercial asignado al tenant
    const [tenantRes, productsCountRes] = await Promise.all([
      admin.from('tenants').select('plan_slug, theme_config').eq('id', tenant_id).maybeSingle(),
      admin.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id),
    ]);

    const isCustomLandingTenant =
      tenantRes.data?.theme_config?.custom_landing_unlocked === true ||
      tenantRes.data?.theme_config?.store_template === 'landing';

    // Los planes comerciales estándar y sus límites aplican exclusivamente a tiendas con catálogo estándar.
    // Los clientes con landing corporativa / personalizada (ej: Ayme) están exentos de estos límites.
    if (!isCustomLandingTenant) {
      const tenantPlanSlug = tenantRes.data?.plan_slug || 'free';
      const plan = getPlanBySlug(tenantPlanSlug);
      const currentProductsCount = productsCountRes.count || 0;

      const limitCheck = checkPlanLimit(plan, 'max_products', currentProductsCount);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: `Has alcanzado el límite de ${limitCheck.max} productos permitido por tu ${plan.name}. Contacta a soporte para ampliar tu cupo con la promoción del 50% OFF.`,
            code: 'PLAN_LIMIT_REACHED',
            limit: limitCheck.max,
            current: currentProductsCount,
            plan: plan.name,
          },
          { status: 403 }
        );
      }
    }

    const clientIp = getClientIp(request);
    // Rate limiting: máximo 40 creaciones de productos por minuto por tienda/IP
    const { isAllowed } = checkRateLimit(`prod_create_${tenant_id}_${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 40,
    });
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes de creación de producto. Por favor espera un momento.' },
        { status: 429 }
      );
    }

    // Generar slug base URL-friendly
    const baseSlug = name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const cleanSku = sku.toLowerCase().replace(/[^a-z0-9]/g, '');
    let targetSlug = `${baseSlug}-${cleanSku}`;

    // Comprobar y evitar colisión de slug (previene error duplicate key value violates unique constraint)
    const { data: existingProd } = await admin
      .from('products')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('slug', targetSlug)
      .single();

    if (existingProd) {
      targetSlug = `${targetSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Procesar y subir imagen a Supabase Storage (NUNCA base64 crudo en base de datos)
    let finalImages: string[] = Array.isArray(images) && images.length > 0 
      ? images.filter((img: string) => typeof img === 'string' && img.startsWith('http')) 
      : [];

    if (body.imageData && typeof body.imageData === 'string' && body.imageData.startsWith('data:image')) {
      try {
        const matches = body.imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1].toLowerCase().trim();
          const ALLOWED_IMAGE_TYPES: Record<string, string> = {
            'image/webp': 'webp',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
          };
          const ext = ALLOWED_IMAGE_TYPES[mimeType];
          if (ext) {
            const buffer = Buffer.from(matches[2], 'base64');
            // Validar firma binaria Magic Bytes contra MIME spoofing y límite de 5MB
            if (buffer.length <= 5 * 1024 * 1024 && isValidImageMagicBytes(buffer, mimeType)) {
              const filePath = `products/${tenant_id}/${cleanSku}-${Date.now()}.${ext}`;

              const { error: uploadErr } = await admin.storage
                .from('support-attachments')
                .upload(filePath, buffer, {
                  contentType: mimeType,
                  upsert: true,
                });

              if (!uploadErr) {
                const { data: pubData } = admin.storage
                  .from('support-attachments')
                  .getPublicUrl(filePath);
                if (pubData?.publicUrl) {
                  // La foto recién subida se coloca como principal y preserva la galería (máximo 8)
                  finalImages = [pubData.publicUrl, ...finalImages.filter((u) => u !== pubData.publicUrl && !u.startsWith('data:'))].slice(0, 8);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error subiendo imagen de producto a Storage:', err);
      }
    } else if (finalImages.length === 0 && body.image_url && typeof body.image_url === 'string' && body.image_url.trim().startsWith('http')) {
      finalImages = [body.image_url.trim()];
    }

    if (!finalImages) {
      finalImages = [];
    }

    const formattedPriceTiers = Array.isArray(price_tiers)
      ? price_tiers
          .filter((t: any) => typeof t?.min_qty === 'number' && t.min_qty > 0 && typeof t?.price === 'number' && t.price > 0)
          .sort((a: any, b: any) => a.min_qty - b.min_qty)
      : [];

    // Sanitizar category_id para evitar error 22P02 de sintaxis UUID o 23503 de clave foránea
    let safeCategoryId: string | null = null;
    if (category_id && typeof category_id === 'string') {
      const cleanCatId = category_id.trim();
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCatId);
      if (isValidUuid) {
        const { data: catExists } = await admin
          .from('categories')
          .select('id')
          .eq('id', cleanCatId)
          .eq('tenant_id', tenant_id)
          .maybeSingle();
        safeCategoryId = catExists ? cleanCatId : null;
      }
    }

    const { data: product, error } = await admin
      .from('products')
      .insert({
        tenant_id,
        category_id: safeCategoryId,
        slug: targetSlug,
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        description: description ? description.trim() : null,
        min_order_qty: Number(min_order_qty) || 1,
        units_per_package: Number(units_per_package) || 1,
        attributes: attributes || {},
        images: finalImages,
        price_tiers: formattedPriceTiers,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creando producto:', error);
      if (error.code === '23505') {
        const detail = (error.details || '').toLowerCase();
        if (detail.includes('sku')) {
          return NextResponse.json(
            { error: `Ya existe otro producto con el código SKU "${sku}". Por favor elige un código diferente.` },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'Ya existe otro producto con este mismo nombre o enlace web en tu catálogo. Por favor usa un nombre diferente.' },
          { status: 409 }
        );
      }
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'La categoría seleccionada no existe o fue retirada. Elige otra categoría o marca "Sin categorizar".' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: `No se pudo crear el producto: ${error.message || 'Verifica los datos ingresados'}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
  } catch (err: unknown) {
    console.error('Excepción en POST /api/admin/products:', err);
    return NextResponse.json({ error: 'Error del servidor al registrar el producto' }, { status: 500 });
  }
}

// 2. ACTUALIZAR / EDITAR PRODUCTO O ACCIONES EN LOTE (PATCH)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      product_ids,
      action,
      tenant_id,
      name,
      sku,
      slug,
      category_id,
      description,
      min_order_qty,
      units_per_package,
      attributes,
      imageData,
      images,
      image_url,
      price_tiers,
    } = body;

    const admin = getAdminClient();

    // A. ACCIONES EN LOTE NATIVAS (Acelera actualizaciones masivas de 50 peticiones a 1 sola)
    if (Array.isArray(product_ids) && product_ids.length > 0 && action && tenant_id) {
      const auth = await verifyTenantAdmin({ tenantId: tenant_id });
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
      }

      if (action === 'feature' || action === 'unfeature') {
        const isFeatured = action === 'feature';
        const { data: targetProds } = await admin
          .from('products')
          .select('id, attributes')
          .in('id', product_ids)
          .eq('tenant_id', tenant_id);

        if (targetProds && targetProds.length > 0) {
          await Promise.all(
            targetProds.map((p) =>
              admin
                .from('products')
                .update({
                  updated_at: new Date().toISOString(),
                  attributes: {
                    ...(p.attributes || {}),
                    featured: isFeatured,
                    badge: isFeatured ? '5 Estrellas' : (p.attributes?.badge === '5 Estrellas' ? null : p.attributes?.badge),
                  },
                })
                .eq('id', p.id)
            )
          );
        }

        return NextResponse.json({ success: true, count: targetProds?.length || 0 });
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Falta id del producto' }, { status: 400 });
    }

    // 1. Obtener producto actual para validar tenant
    const { data: currentProduct, error: fetchErr } = await admin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !currentProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const auth = await verifyTenantAdmin({ tenantId: currentProduct.tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    // 2. Si viene enlace URL directo o nueva imagen en base64, procesar
    let finalImages: string[] = Array.isArray(images) && images.length > 0 
      ? images.filter((img: string) => typeof img === 'string' && img.startsWith('http')) 
      : (Array.isArray(currentProduct.images) ? currentProduct.images : []);

    if (imageData && typeof imageData === 'string' && imageData.startsWith('data:image')) {
      try {
        const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1].toLowerCase().trim();
          const ALLOWED_IMAGE_TYPES: Record<string, string> = {
            'image/webp': 'webp',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
          };
          const ext = ALLOWED_IMAGE_TYPES[mimeType];
          if (ext) {
            const buffer = Buffer.from(matches[2], 'base64');
            if (buffer.length <= 5 * 1024 * 1024 && isValidImageMagicBytes(buffer, mimeType)) {
              const cleanSku = (sku || currentProduct.sku).toLowerCase().replace(/[^a-z0-9]/g, '');
              const filePath = `products/${currentProduct.tenant_id}/${cleanSku}-${Date.now()}.${ext}`;

              const { error: uploadErr } = await admin.storage
                .from('support-attachments')
                .upload(filePath, buffer, { contentType: mimeType, upsert: true });

              if (!uploadErr) {
                const { data: pubData } = admin.storage
                  .from('support-attachments')
                  .getPublicUrl(filePath);
                if (pubData?.publicUrl) {
                  // La foto recién subida se coloca como principal y preserva la galería (máximo 8)
                  finalImages = [pubData.publicUrl, ...finalImages.filter((u) => u !== pubData.publicUrl && !u.startsWith('data:'))].slice(0, 8);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error subiendo imagen al editar producto:', err);
      }
    } else if (finalImages.length === 0 && image_url && typeof image_url === 'string' && image_url.trim().startsWith('http')) {
      finalImages = [image_url.trim()];
    }

    // 3. Preparar campos a actualizar
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      images: finalImages,
    };

    if (name) updatePayload.name = name.trim();
    if (sku) updatePayload.sku = sku.trim().toUpperCase();

    // Manejo de Slug Estable: Preservar slug existente y evitar rotura de enlaces de WhatsApp / SEO
    if (slug && typeof slug === 'string' && slug.trim()) {
      let targetSlug = slug
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120);

      if (targetSlug && targetSlug !== currentProduct.slug) {
        // Si el usuario editó explícitamente el slug, verificar que no colisione con otro producto del tenant
        const { data: collision } = await admin
          .from('products')
          .select('id')
          .eq('tenant_id', currentProduct.tenant_id)
          .eq('slug', targetSlug)
          .neq('id', id)
          .maybeSingle();

        if (collision) {
          targetSlug = `${targetSlug.slice(0, 110)}-${Math.floor(10 + Math.random() * 90)}`;
        }
        updatePayload.slug = targetSlug;
      }
    } else if (!currentProduct.slug) {
      // Solo si el producto no tenía slug previo, generar uno determinista
      const cleanName = (name || currentProduct.name || 'producto')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
      const cleanSkuPart = (sku || currentProduct.sku || 'sku').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
      updatePayload.slug = `${cleanName}-${cleanSkuPart}-${Math.floor(10 + Math.random() * 90)}`;
    }

    if (category_id !== undefined) {
      if (!category_id) {
        updatePayload.category_id = null;
      } else {
        const catStr = String(category_id).trim();
        const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catStr);
        if (isValidUuid) {
          const { data: catExists } = await admin
            .from('categories')
            .select('id')
            .eq('id', catStr)
            .eq('tenant_id', currentProduct.tenant_id)
            .maybeSingle();
          updatePayload.category_id = catExists ? catStr : null;
        } else {
          updatePayload.category_id = null;
        }
      }
    }
    if (description !== undefined) updatePayload.description = description ? description.trim() : null;
    if (min_order_qty !== undefined) updatePayload.min_order_qty = Number(min_order_qty) || 1;
    if (units_per_package !== undefined) updatePayload.units_per_package = Number(units_per_package) || 1;
    if (attributes !== undefined) updatePayload.attributes = attributes;
    if (price_tiers !== undefined) {
      updatePayload.price_tiers = Array.isArray(price_tiers)
        ? price_tiers
            .filter((t: any) => typeof t?.min_qty === 'number' && t.min_qty > 0 && typeof t?.price === 'number' && t.price > 0)
            .sort((a: any, b: any) => a.min_qty - b.min_qty)
        : [];
    }

    const { data: updatedProduct, error: updateErr } = await admin
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      console.error('Error actualizando producto:', updateErr);
      
      // Mensajes comerciales y específicos para que el comerciante sepa exactamente qué corregir
      if (updateErr.code === '23505') {
        const detail = (updateErr.details || '').toLowerCase();
        if (detail.includes('sku')) {
          return NextResponse.json(
            { error: `Ya existe otro producto con el código SKU "${updatePayload.sku || sku}". Por favor cámbialo en la pestaña Inventario para poder guardarlo.` },
            { status: 409 }
          );
        }
        if (detail.includes('slug')) {
          return NextResponse.json(
            { error: 'Ya existe otro producto con el mismo nombre o enlace web en tu catálogo. Por favor modifica el nombre del producto o el enlace permanente.' },
            { status: 409 }
          );
        }
      }

      if (updateErr.code === '23503') {
        return NextResponse.json(
          { error: 'La categoría seleccionada no es válida o fue eliminada. Por favor selecciona otra categoría o marca "Sin categorizar".' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `No se pudo guardar el producto modificado: ${updateErr.message || 'Verifica los datos e intenta nuevamente.'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (err: unknown) {
    console.error('Excepción en PATCH /api/admin/products:', err);
    return NextResponse.json({ error: 'Error del servidor al actualizar el producto' }, { status: 500 });
  }
}

// 3. ELIMINAR PRODUCTO INDIVIDUAL O EN LOTE (DELETE)
export async function DELETE(request: Request) {
  try {
    let productId: string | null = null;
    let productIds: string[] = [];
    let tenantId: string | null = null;

    // Soportar parámetros por URL o por body JSON para operaciones por lote
    const { searchParams } = new URL(request.url);
    productId = searchParams.get('productId');
    const queryIds = searchParams.get('productIds');
    if (queryIds) {
      productIds = queryIds.split(',').map((s) => s.trim()).filter(Boolean);
    }
    tenantId = searchParams.get('tenantId');

    // Si viene body JSON con productIds
    if (!productId && productIds.length === 0) {
      try {
        const body = await request.json();
        if (body.productId) productId = body.productId;
        if (Array.isArray(body.productIds)) productIds = body.productIds;
        if (body.tenant_id) tenantId = body.tenant_id;
      } catch {
        // Ignorar si no hay body
      }
    }

    const admin = getAdminClient();

    // A. ELIMINACIÓN POR LOTE EN 1 SOLA CONSULTA SQL
    if (productIds.length > 0 && tenantId) {
      const auth = await verifyTenantAdmin({ tenantId });
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
      }

      const { error: batchErr } = await admin
        .from('products')
        .delete()
        .in('id', productIds)
        .eq('tenant_id', tenantId);

      if (batchErr) {
        console.error('Error eliminando productos en lote:', batchErr);
        return NextResponse.json({ error: 'No se pudieron eliminar los productos en lote' }, { status: 500 });
      }

      return NextResponse.json({ success: true, count: productIds.length });
    }

    // B. ELIMINACIÓN INDIVIDUAL
    if (!productId) {
      return NextResponse.json({ error: 'Falta productId o productIds' }, { status: 400 });
    }

    // 1. Obtener a qué tenant pertenece el producto antes de permitir borrarlo
    const { data: targetProduct, error: fetchErr } = await admin
      .from('products')
      .select('id, tenant_id')
      .eq('id', productId)
      .single();

    if (fetchErr || !targetProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // 2. Validar autorización estricta para este tenant específico
    const auth = await verifyTenantAdmin({ tenantId: targetProduct.tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const { error } = await admin.from('products').delete().eq('id', productId);

    if (error) {
      console.error('Error eliminando producto (DELETE):', error);
      return NextResponse.json({ error: 'No se pudo eliminar el producto' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Excepción en DELETE /api/admin/products:', err);
    return NextResponse.json({ error: 'Error del servidor al eliminar el producto' }, { status: 500 });
  }
}
