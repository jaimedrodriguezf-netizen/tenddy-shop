import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';

// Actualizar apariencia y configuración del Tenant
export async function PATCH(request: Request) {
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
    };

    const updatedLanding = {
      ...(currentTenant.landing_config || {}),
      hero_title: hero_title !== undefined ? hero_title : currentTenant.landing_config?.hero_title,
      hero_subtitle: hero_subtitle !== undefined ? hero_subtitle : currentTenant.landing_config?.hero_subtitle,
      hero_video_url: hero_video_url !== undefined ? hero_video_url : currentTenant.landing_config?.hero_video_url,
      hero_image_url: hero_image_url !== undefined ? hero_image_url : currentTenant.landing_config?.hero_image_url,
      show_services: show_services !== undefined ? show_services : currentTenant.landing_config?.show_services,
      show_branches: show_branches !== undefined ? show_branches : currentTenant.landing_config?.show_branches,
    };

    const updatePayload: Record<string, any> = {
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
