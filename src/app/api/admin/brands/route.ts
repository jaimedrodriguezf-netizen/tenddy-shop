import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';
import { Brand } from '@/lib/types';

// Procesar foto de la marca y subir a Storage
async function processBrandImage(
  admin: any,
  tenantId: string,
  slug: string,
  imageUrl?: string | null,
  imageData?: string | null
): Promise<string | null> {
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().startsWith('http')) {
    return imageUrl.trim();
  }
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
          if (buffer.length <= 5 * 1024 * 1024) {
            const cleanSlugPart = slug.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
            const filePath = `brands/${tenantId}/${cleanSlugPart}-${Date.now()}.${ext}`;

            const { error: uploadErr } = await admin.storage
              .from('support-attachments')
              .upload(filePath, buffer, { contentType: mimeType, upsert: true });

            if (!uploadErr) {
              const { data: pubData } = admin.storage
                .from('support-attachments')
                .getPublicUrl(filePath);
              return pubData?.publicUrl || null;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error subiendo imagen de marca a Storage:', err);
    }
  }
  return null;
}

// 1. OBTENER MARCAS (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Falta tenantId' }, { status: 400 });
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

    const brands: Brand[] = tenant.settings?.brands || [];
    return NextResponse.json({ success: true, brands });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// 2. CREAR MARCA (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, name, slug: clientSlug, description, parent_id, image_url, imageData } = body;

    if (!tenant_id || !name) {
      return NextResponse.json({ error: 'Nombre de la marca y tenant son requeridos' }, { status: 400 });
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

    if (!baseSlug) baseSlug = `marca-${Date.now()}`;

    const existingBrands: Brand[] = tenant.settings?.brands || [];

    // Evitar colisión de slug
    if (existingBrands.some((b) => b.slug === baseSlug)) {
      baseSlug = `${baseSlug}-${Math.floor(10 + Math.random() * 90)}`;
    }

    // Procesar foto
    const finalImageUrl = await processBrandImage(admin, tenant_id, baseSlug, image_url, imageData);

    const newBrand: Brand = {
      id: `br-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      slug: baseSlug,
      description: description ? description.trim() : undefined,
      parent_id: parent_id && parent_id.trim() ? parent_id.trim() : null,
      image_url: finalImageUrl || undefined,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const updatedBrands = [...existingBrands, newBrand];
    const newSettings = {
      ...(tenant.settings || {}),
      brands: updatedBrands,
    };

    const { error: updateErr } = await admin
      .from('tenants')
      .update({ settings: newSettings, updated_at: new Date().toISOString() })
      .eq('id', tenant_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, brand: newBrand });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// 3. EDITAR MARCA (PATCH)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, id, name, slug: clientSlug, description, parent_id, is_active, image_url, imageData } = body;

    if (!tenant_id || !id) {
      return NextResponse.json({ error: 'Falta tenant_id o id de la marca' }, { status: 400 });
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

    const existingBrands: Brand[] = tenant.settings?.brands || [];
    const targetIndex = existingBrands.findIndex((b) => b.id === id);

    if (targetIndex === -1) {
      return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 });
    }

    const currentBrand = existingBrands[targetIndex];
    let finalImageUrl = currentBrand.image_url;

    if (image_url !== undefined || imageData !== undefined) {
      if (image_url === null || image_url === '') {
        finalImageUrl = undefined;
      } else {
        const uploaded = await processBrandImage(admin, tenant_id, currentBrand.slug, image_url, imageData);
        if (uploaded) finalImageUrl = uploaded;
      }
    }

    const updatedBrand: Brand = {
      ...currentBrand,
      name: name !== undefined ? name.trim() : currentBrand.name,
      slug: clientSlug !== undefined && clientSlug.trim() ? clientSlug.trim() : currentBrand.slug,
      description: description !== undefined ? (description ? description.trim() : undefined) : currentBrand.description,
      parent_id: parent_id !== undefined ? (parent_id ? parent_id.trim() : null) : currentBrand.parent_id,
      is_active: is_active !== undefined ? Boolean(is_active) : currentBrand.is_active,
      image_url: finalImageUrl,
    };

    const updatedBrands = [...existingBrands];
    updatedBrands[targetIndex] = updatedBrand;

    const newSettings = {
      ...(tenant.settings || {}),
      brands: updatedBrands,
    };

    const { error: updateErr } = await admin
      .from('tenants')
      .update({ settings: newSettings, updated_at: new Date().toISOString() })
      .eq('id', tenant_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, brand: updatedBrand });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// 4. ELIMINAR MARCA (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const brandId = searchParams.get('brandId');

    if (!tenantId || !brandId) {
      return NextResponse.json({ error: 'Falta tenantId o brandId' }, { status: 400 });
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

    const existingBrands: Brand[] = tenant.settings?.brands || [];
    const updatedBrands = existingBrands.filter((b) => b.id !== brandId);

    const newSettings = {
      ...(tenant.settings || {}),
      brands: updatedBrands,
    };

    const { error: updateErr } = await admin
      .from('tenants')
      .update({ settings: newSettings, updated_at: new Date().toISOString() })
      .eq('id', tenantId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
