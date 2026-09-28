import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';

// Obtener o crear productos desde el panel administrativo
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

    // 1. Validar autorización estricta para este tenant específico
    const auth = await verifyTenantAdmin({ tenantId: tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
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

    // 2. Procesar y subir imagen a Supabase Storage si se envió base64
    let finalImages: string[] = Array.isArray(images) && images.length > 0 ? images : [];
    if (body.imageData && typeof body.imageData === 'string' && body.imageData.startsWith('data:image')) {
      try {
        const matches = body.imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
          const buffer = Buffer.from(matches[2], 'base64');
          const cleanSku = sku.toLowerCase().replace(/[^a-z0-9]/g, '');
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
        slug: `${slug}-${sku.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
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

// Eliminar producto
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
