import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';

// Actualizar apariencia y configuración del Tenant
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      tenant_id,
      name,
      primary_color,
      logo_url,
      hero_title,
      hero_subtitle,
      hero_video_url,
      hero_image_url,
      show_services,
      show_branches,
    } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: 'Falta tenant_id' }, { status: 400 });
    }

    // 1. Validar autorización estricta para este tenant
    const auth = await verifyTenantAdmin({ tenantId: tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();

    // Obtener configuración actual
    const { data: currentTenant, error: fetchErr } = await admin
      .from('tenants')
      .select('theme_config, landing_config')
      .eq('id', tenant_id)
      .single();

    if (fetchErr || !currentTenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    // Fusionar configs
    const updatedTheme = {
      ...(currentTenant.theme_config || {}),
      primary_color: primary_color || currentTenant.theme_config?.primary_color || '#0284c7',
      store_template: body.store_template || currentTenant.theme_config?.store_template || 'temu',
      show_best_sellers: body.show_best_sellers !== undefined ? body.show_best_sellers : (currentTenant.theme_config?.show_best_sellers ?? true),
      show_featured_ratings: body.show_featured_ratings !== undefined ? body.show_featured_ratings : (currentTenant.theme_config?.show_featured_ratings ?? true),
    };

    const updatedLanding = {
      ...(currentTenant.landing_config || {}),
      hero_title: hero_title !== undefined ? hero_title : currentTenant.landing_config?.hero_title,
      hero_subtitle: hero_subtitle !== undefined ? hero_subtitle : currentTenant.landing_config?.hero_subtitle,
      hero_video_url: hero_video_url !== undefined ? hero_video_url : currentTenant.landing_config?.hero_video_url,
      hero_image_url: hero_image_url !== undefined ? hero_image_url : currentTenant.landing_config?.hero_image_url,
      show_services: show_services !== undefined ? show_services : currentTenant.landing_config?.show_services,
      show_branches: show_branches !== undefined ? show_branches : currentTenant.landing_config?.show_branches,
      show_best_sellers: body.show_best_sellers !== undefined ? body.show_best_sellers : (currentTenant.landing_config?.show_best_sellers ?? true),
      show_featured_ratings: body.show_featured_ratings !== undefined ? body.show_featured_ratings : (currentTenant.landing_config?.show_featured_ratings ?? true),
    };

    const updatePayload: Record<string, unknown> = {
      theme_config: updatedTheme,
      landing_config: updatedLanding,
      updated_at: new Date().toISOString(),
    };

    if (name) updatePayload.name = name.trim();
    if (logo_url !== undefined) updatePayload.logo_url = logo_url;

    const { data: updated, error: updateErr } = await admin
      .from('tenants')
      .update(updatePayload)
      .eq('id', tenant_id)
      .select('*')
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tenant: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
