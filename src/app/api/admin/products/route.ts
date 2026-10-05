import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';

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

    const admin = getAdminClient();

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
    let finalImages: string[] = Array.isArray(images) && images.length > 0 ? images : [];
    if (body.image_url && typeof body.image_url === 'string' && body.image_url.trim().startsWith('http')) {
      finalImages = [body.image_url.trim()];
    } else if (body.imageData && typeof body.imageData === 'string' && body.imageData.startsWith('data:image')) {
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
            // Límite estricto de 5MB por foto de producto
            if (buffer.length <= 5 * 1024 * 1024) {
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
                  finalImages = [pubData.publicUrl];
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error subiendo imagen de producto a Storage:', err);
      }
    }

    if (finalImages.length === 0) {
      finalImages = ['/assets/products/ayme-001.svg'];
    }

    const { data: product, error } = await admin
      .from('products')
      .insert({
        tenant_id,
        category_id: category_id || null,
        slug: targetSlug,
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        description: description ? description.trim() : null,
        min_order_qty: Number(min_order_qty) || 1,
        units_per_package: Number(units_per_package) || 1,
        attributes: attributes || {},
        images: finalImages,
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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// 2. ACTUALIZAR / EDITAR PRODUCTO (PATCH)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      sku,
      category_id,
      description,
      min_order_qty,
      units_per_package,
      attributes,
      imageData,
      images,
      image_url,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Falta id del producto' }, { status: 400 });
    }

    const admin = getAdminClient();

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
    let finalImages = Array.isArray(images) && images.length > 0 ? images : currentProduct.images || [];
    if (image_url && typeof image_url === 'string' && image_url.trim().startsWith('http')) {
      finalImages = [image_url.trim()];
    } else if (imageData && typeof imageData === 'string' && imageData.startsWith('data:image')) {
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
            if (buffer.length <= 5 * 1024 * 1024) {
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
                  finalImages = [pubData.publicUrl];
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error subiendo imagen al editar producto:', err);
      }
    }

    // 3. Preparar campos a actualizar
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      images: finalImages,
    };

    if (name) updatePayload.name = name.trim();
    if (sku) updatePayload.sku = sku.trim().toUpperCase();
    if (name || sku) {
      const cleanName = (name || currentProduct.name)
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
      const cleanSkuPart = (sku || currentProduct.sku).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
      updatePayload.slug = `${cleanName}-${cleanSkuPart}-${Math.floor(10 + Math.random() * 90)}`;
    }
    if (category_id !== undefined) updatePayload.category_id = category_id || null;
    if (description !== undefined) updatePayload.description = description ? description.trim() : null;
    if (min_order_qty !== undefined) updatePayload.min_order_qty = Number(min_order_qty) || 1;
    if (units_per_package !== undefined) updatePayload.units_per_package = Number(units_per_package) || 1;
    if (attributes !== undefined) updatePayload.attributes = attributes;

    const { data: updatedProduct, error: updateErr } = await admin
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      console.error('Error actualizando producto:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// 3. ELIMINAR PRODUCTO (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Falta productId' }, { status: 400 });
    }

    const admin = getAdminClient();

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
