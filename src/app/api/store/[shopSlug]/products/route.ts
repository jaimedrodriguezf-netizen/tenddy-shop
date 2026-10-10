import { NextResponse } from 'next/server';
import { getTenantByHostOrSlug, getTenantCatalog } from '@/lib/tenant';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  try {
    const clientIp = getClientIp(request);

    // Rate limiting para catálogo público: máximo 60 peticiones por minuto por IP (protección scraping y DoS)
    const { isAllowed } = checkRateLimit(`cat_view_${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 60,
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera un momento.' },
        { status: 429 }
      );
    }

    const { shopSlug } = await params;
    if (!shopSlug) {
      return NextResponse.json({ error: 'Falta shopSlug' }, { status: 400 });
    }

    const tenant = await getTenantByHostOrSlug(shopSlug);
    if (!tenant) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    }

    const { categories, products, branches } = await getTenantCatalog(tenant.id);

    // Filtrar settings estrictamente a propiedades públicas de catálogo (previene fuga de configuraciones internas)
    const publicSettings = {
      currency: tenant.settings?.currency || 'USD',
      currency_symbol: tenant.settings?.currency_symbol || '$',
      enable_whatsapp_rfq: tenant.settings?.enable_whatsapp_rfq ?? true,
      requires_quote_approval: tenant.settings?.requires_quote_approval ?? true,
    };

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        industry_type: tenant.industry_type,
        logo_url: tenant.logo_url,
        theme_config: tenant.theme_config,
        landing_config: tenant.landing_config,
        settings: publicSettings,
      },
      categories,
      products,
      branches,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
