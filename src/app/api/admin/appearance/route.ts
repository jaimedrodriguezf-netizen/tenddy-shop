import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';
import { normalizeEcuadorPhone } from '@/lib/ecuador-phone';

// Helper para sanitizar URLs de imagen (Permite URLs HTTPS/HTTP de Storage y rutas relativas locales seguras /...)
function sanitizeImageUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  const clean = url.trim();
  if (clean.startsWith('https://') || clean.startsWith('http://') || (clean.startsWith('/') && !clean.startsWith('//'))) {
    return clean;
  }
  return null;
}

// Actualizar apariencia y configuración del Tenant
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      tenant_id,
      name,
      primary_color,
      secondary_color,
      accent_color,
      landing_bg_color,
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
    const logoHeightRaw = Number(body.logo_height);
    const validLogoHeight = !isNaN(logoHeightRaw) && logoHeightRaw >= 20 && logoHeightRaw <= 72
      ? Math.round(logoHeightRaw)
      : (currentTenant.theme_config?.logo_height || 38);

    const sanitizeHexColor = (val: unknown, fallback: string): string => {
      if (typeof val === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val.trim())) {
        return val.trim();
      }
      return fallback;
    };

    // Normalizar y sanitizar redes sociales y WhatsApp Ecuador
    let updatedSocialLinks = currentTenant.landing_config?.social_links || currentTenant.theme_config?.social_links || {};
    if (body.social_links && typeof body.social_links === 'object') {
      const s = body.social_links;
      const mainPhoneNorm = s.whatsapp_main ? normalizeEcuadorPhone(s.whatsapp_main) : null;
      const urgentPhoneNorm = s.whatsapp_urgent ? normalizeEcuadorPhone(s.whatsapp_urgent) : null;

      updatedSocialLinks = {
        ...updatedSocialLinks,
        whatsapp_main: mainPhoneNorm?.international || (s.whatsapp_main ? String(s.whatsapp_main).trim() : (updatedSocialLinks.whatsapp_main || '')),
        whatsapp_display: mainPhoneNorm?.display || (s.whatsapp_display ? String(s.whatsapp_display).trim() : (updatedSocialLinks.whatsapp_display || '')),
        whatsapp_urgent: urgentPhoneNorm?.international || (s.whatsapp_urgent ? String(s.whatsapp_urgent).trim() : (updatedSocialLinks.whatsapp_urgent || '')),
        whatsapp_welcome_msg: typeof s.whatsapp_welcome_msg === 'string' ? s.whatsapp_welcome_msg.trim() : updatedSocialLinks.whatsapp_welcome_msg,
        linkedin: typeof s.linkedin === 'string' ? s.linkedin.trim() : updatedSocialLinks.linkedin,
        facebook: typeof s.facebook === 'string' ? s.facebook.trim() : updatedSocialLinks.facebook,
        instagram: typeof s.instagram === 'string' ? s.instagram.trim() : updatedSocialLinks.instagram,
        tiktok: typeof s.tiktok === 'string' ? s.tiktok.trim() : updatedSocialLinks.tiktok,
        youtube: typeof s.youtube === 'string' ? s.youtube.trim() : updatedSocialLinks.youtube,
        show_floating_whatsapp: s.show_floating_whatsapp !== undefined ? Boolean(s.show_floating_whatsapp) : (updatedSocialLinks.show_floating_whatsapp ?? true),
      };
    }

    const updatedTheme = {
      ...(currentTenant.theme_config || {}),
      primary_color: sanitizeHexColor(primary_color, currentTenant.theme_config?.primary_color || '#0284c7'),
      secondary_color: sanitizeHexColor(secondary_color, currentTenant.theme_config?.secondary_color || '#a61c2e'),
      accent_color: sanitizeHexColor(accent_color, currentTenant.theme_config?.accent_color || '#0284c7'),
      landing_bg_color: sanitizeHexColor(landing_bg_color, currentTenant.theme_config?.landing_bg_color || '#020617'),
      store_template: body.store_template || currentTenant.theme_config?.store_template || 'temu',
      logo_height: validLogoHeight,
      show_top_bar: body.show_top_bar !== undefined ? Boolean(body.show_top_bar) : (currentTenant.theme_config?.show_top_bar ?? true),
      top_bar_text: body.top_bar_text !== undefined ? String(body.top_bar_text).trim() : (currentTenant.theme_config?.top_bar_text ?? ''),
      show_best_sellers: body.show_best_sellers !== undefined ? body.show_best_sellers : (currentTenant.theme_config?.show_best_sellers ?? true),
      show_featured_ratings: body.show_featured_ratings !== undefined ? body.show_featured_ratings : (currentTenant.theme_config?.show_featured_ratings ?? true),
      social_links: updatedSocialLinks,
    };

    const sanitizedHeroImage = hero_image_url !== undefined 
      ? sanitizeImageUrl(hero_image_url) 
      : currentTenant.landing_config?.hero_image_url;

    const updatedLanding = {
      ...(currentTenant.landing_config || {}),
      hero_title: hero_title !== undefined ? hero_title : currentTenant.landing_config?.hero_title,
      hero_subtitle: hero_subtitle !== undefined ? hero_subtitle : currentTenant.landing_config?.hero_subtitle,
      hero_video_url: hero_video_url !== undefined ? hero_video_url : currentTenant.landing_config?.hero_video_url,
      hero_image_url: sanitizedHeroImage,
      show_services: show_services !== undefined ? show_services : currentTenant.landing_config?.show_services,
      show_branches: show_branches !== undefined ? show_branches : currentTenant.landing_config?.show_branches,
      show_top_bar: body.show_top_bar !== undefined ? Boolean(body.show_top_bar) : (currentTenant.landing_config?.show_top_bar ?? true),
      top_bar_text: body.top_bar_text !== undefined ? String(body.top_bar_text).trim() : (currentTenant.landing_config?.top_bar_text ?? ''),
      show_best_sellers: body.show_best_sellers !== undefined ? body.show_best_sellers : (currentTenant.landing_config?.show_best_sellers ?? true),
      show_featured_ratings: body.show_featured_ratings !== undefined ? body.show_featured_ratings : (currentTenant.landing_config?.show_featured_ratings ?? true),
      social_links: updatedSocialLinks,
      whatsapp_default: updatedSocialLinks.whatsapp_main || currentTenant.landing_config?.whatsapp_default || '593998722324',
      display_phone: updatedSocialLinks.whatsapp_display || currentTenant.landing_config?.display_phone || '0998722324',
    };

    const updatePayload: Record<string, unknown> = {
      theme_config: updatedTheme,
      landing_config: updatedLanding,
      updated_at: new Date().toISOString(),
    };

    if (name) updatePayload.name = name.trim();
    if (logo_url !== undefined) {
      updatePayload.logo_url = sanitizeImageUrl(logo_url);
    }

    const { data: updated, error: updateErr } = await admin
      .from('tenants')
      .update(updatePayload)
      .eq('id', tenant_id)
      .select('*')
      .single();

    if (updateErr) {
      console.error('Error actualizando apariencia (PATCH):', updateErr);
      return NextResponse.json({ error: 'No se pudo actualizar la configuración de la tienda' }, { status: 500 });
    }

    // Invalidar caché de Next.js para que los cambios impacten en tiempo real en la tienda pública
    try {
      revalidatePath(`/store/${updated.slug}`);
      revalidatePath(`/store/${updated.slug}/admin`);
    } catch (revalErr) {
      console.warn('Advertencia en revalidatePath:', revalErr);
    }

    return NextResponse.json({ success: true, tenant: updated });
  } catch (err: unknown) {
    console.error('Excepción en PATCH /api/admin/appearance:', err);
    return NextResponse.json({ error: 'Error del servidor al actualizar apariencia' }, { status: 500 });
  }
}
