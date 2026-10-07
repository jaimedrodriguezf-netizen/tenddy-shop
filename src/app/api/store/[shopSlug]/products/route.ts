import { NextResponse } from 'next/server';
import { getTenantByHostOrSlug, getTenantCatalog } from '@/lib/tenant';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  try {
    const { shopSlug } = await params;
    if (!shopSlug) {
      return NextResponse.json({ error: 'Falta shopSlug' }, { status: 400 });
    }

    const tenant = await getTenantByHostOrSlug(shopSlug);
    if (!tenant) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    }

    const { categories, products, branches } = await getTenantCatalog(tenant.id);

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
        settings: tenant.settings,
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
