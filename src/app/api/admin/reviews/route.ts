import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';
import { ProductReview, ReviewStatus } from '@/lib/types';

// 1. OBTENER VALORACIONES (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const statusParam = searchParams.get('status') as ReviewStatus | 'all' | null;
    const productIdParam = searchParams.get('productId');
    const ratingParam = searchParams.get('rating');

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

    const allReviews: ProductReview[] = tenant.settings?.reviews || [];

    // Calcular contadores por estado
    const counts = {
      all: allReviews.filter((r) => r.status !== 'trash').length,
      pending: allReviews.filter((r) => r.status === 'pending').length,
      approved: allReviews.filter((r) => r.status === 'approved').length,
      spam: allReviews.filter((r) => r.status === 'spam').length,
      trash: allReviews.filter((r) => r.status === 'trash').length,
    };

    // Aplicar filtros
    let filtered = [...allReviews];

    if (statusParam && statusParam !== 'all') {
      filtered = filtered.filter((r) => r.status === statusParam);
    } else if (statusParam === 'all') {
      // "Todas" excluye la papelera por convención de gestión
      filtered = filtered.filter((r) => r.status !== 'trash');
    }

    if (productIdParam && productIdParam !== 'all') {
      filtered = filtered.filter((r) => r.product_id === productIdParam);
    }

    if (ratingParam && ratingParam !== 'all') {
      const targetRating = Number(ratingParam);
      if (!isNaN(targetRating)) {
        filtered = filtered.filter((r) => r.rating === targetRating);
      }
    }

    return NextResponse.json({
      success: true,
      reviews: filtered,
      allReviews,
      counts,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// 2. CREAR VALORACIÓN MANUAL (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenant_id,
      product_id,
      author_name,
      author_email,
      rating,
      content,
      type = 'review',
      status = 'approved',
    } = body;

    if (!tenant_id || !product_id || !author_name || !content) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (tenant, producto, autor o contenido)' },
        { status: 400 }
      );
    }

    const auth = await verifyTenantAdmin({ tenantId: tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();

    // Obtener tenant y producto
    const [tenantRes, productRes] = await Promise.all([
      admin.from('tenants').select('settings').eq('id', tenant_id).single(),
      admin.from('products').select('name, images').eq('id', product_id).single(),
    ]);

    if (tenantRes.error || !tenantRes.data) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const existingReviews: ProductReview[] = tenantRes.data.settings?.reviews || [];

    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenant_id,
      product_id,
      product_name: productRes.data?.name || 'Producto',
      product_image: productRes.data?.images?.[0] || undefined,
      type: type === 'rating' ? 'rating' : 'review',
      author_name: String(author_name).trim(),
      author_email: author_email ? String(author_email).trim() : undefined,
      author_ip: '127.0.0.1 (admin)',
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      content: String(content).trim(),
      status: (status as ReviewStatus) || 'approved',
      reply: null,
      created_at: new Date().toISOString(),
    };

    const updatedReviews = [newReview, ...existingReviews];
    const newSettings = {
      ...(tenantRes.data.settings || {}),
      reviews: updatedReviews,
    };

    const { error: updateErr } = await admin
      .from('tenants')
      .update({ settings: newSettings })
      .eq('id', tenant_id);

    if (updateErr) {
      return NextResponse.json({ error: 'Error al persistir la valoración' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      review: newReview,
      reviews: updatedReviews,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// 3. ACTUALIZAR VALORACIÓN / ESTADOS EN LOTE / RESPUESTA (PATCH)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, id, ids, action, status, content, rating, reply } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: 'Falta tenant_id' }, { status: 400 });
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

    let existingReviews: ProductReview[] = tenant.settings?.reviews || [];

    // ACCIÓN EN LOTE
    if (ids && Array.isArray(ids) && action) {
      const targetIds = new Set(ids);
      let newStatus: ReviewStatus = 'approved';

      if (action === 'approve') newStatus = 'approved';
      else if (action === 'pending') newStatus = 'pending';
      else if (action === 'spam') newStatus = 'spam';
      else if (action === 'trash') newStatus = 'trash';
      else if (action === 'restore') newStatus = 'approved';

      existingReviews = existingReviews.map((r) => {
        if (targetIds.has(r.id)) {
          return { ...r, status: newStatus };
        }
        return r;
      });
    }
    // ACCIÓN INDIVIDUAL
    else if (id) {
      const idx = existingReviews.findIndex((r) => r.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: 'Valoración no encontrada' }, { status: 404 });
      }

      const current = existingReviews[idx];
      const updated: ProductReview = {
        ...current,
        status: status !== undefined ? status : current.status,
        content: content !== undefined ? String(content).trim() : current.content,
        rating: rating !== undefined ? Math.min(5, Math.max(1, Number(rating))) : current.rating,
        reply: reply !== undefined ? reply : current.reply,
      };

      existingReviews[idx] = updated;
    } else {
      return NextResponse.json({ error: 'Identificador o acción requerida' }, { status: 400 });
    }

    const newSettings = {
      ...(tenant.settings || {}),
      reviews: existingReviews,
    };

    const { error: updateErr } = await admin
      .from('tenants')
      .update({ settings: newSettings })
      .eq('id', tenant_id);

    if (updateErr) {
      return NextResponse.json({ error: 'Error al actualizar valoraciones' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reviews: existingReviews,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// 4. ELIMINAR VALORACIONES PERMANENTEMENTE (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const id = searchParams.get('id');
    const idsParam = searchParams.get('ids');

    if (!tenantId) {
      return NextResponse.json({ error: 'Falta tenantId' }, { status: 400 });
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

    let existingReviews: ProductReview[] = tenant.settings?.reviews || [];

    if (idsParam) {
      const idsToDelete = new Set(idsParam.split(',').map((s) => s.trim()));
      existingReviews = existingReviews.filter((r) => !idsToDelete.has(r.id));
    } else if (id) {
      existingReviews = existingReviews.filter((r) => r.id !== id);
    } else {
      return NextResponse.json({ error: 'Falta id o ids para eliminar' }, { status: 400 });
    }

    const newSettings = {
      ...(tenant.settings || {}),
      reviews: existingReviews,
    };

    const { error: updateErr } = await admin
      .from('tenants')
      .update({ settings: newSettings })
      .eq('id', tenantId);

    if (updateErr) {
      return NextResponse.json({ error: 'Error al eliminar valoración' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reviews: existingReviews,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
