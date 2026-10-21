import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTenantByHostOrSlug, getTenantCatalog } from '@/lib/tenant';
import { verifySuperadminToken, verifyTenantAdminToken } from '@/lib/session';
import TenantLandingView from '@/components/TenantLandingView';
import TenantCatalogView from '@/components/TenantCatalogView';
import ViewTracker from '@/components/ViewTracker';

// Garantizar renderizado dinámico en tiempo real (evitar servir páginas desactualizadas desde caché estática)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ShopPageProps {
  params: Promise<{
    shopSlug: string;
  }>;
}

export default async function ShopPage({ params }: ShopPageProps) {
  const resolvedParams = await params;
  const shopSlug = resolvedParams.shopSlug;

  const tenant = await getTenantByHostOrSlug(shopSlug);
  if (!tenant) {
    notFound();
  }

  // Verificar si el visitante es el administrador o dueño de esta tienda (firma criptográfica)
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(`admin_session_${tenant.slug}`);
  const isSuperadminCookie = cookieStore.get('tenddy_superadmin_session');
  const isAdmin =
    verifyTenantAdminToken(sessionCookie?.value, tenant.slug) ||
    verifySuperadminToken(isSuperadminCookie?.value);

  // Cargar catálogo dinámico desde Supabase
  const { categories, products, branches } = await getTenantCatalog(tenant.id);
  const storeTemplate = (tenant.theme_config as any)?.store_template || 'catalog';

  if (storeTemplate === 'landing') {
    return (
      <>
        <ViewTracker tenantId={tenant.id} />
        <TenantLandingView
          tenant={tenant}
          categories={categories}
          products={products}
          branches={branches}
          isAdmin={isAdmin}
        />
      </>
    );
  }

  // Plantilla Predeterminada: Catálogo ágil enfocado 100% en productos y categorías
  return (
    <>
      <ViewTracker tenantId={tenant.id} />
      <TenantCatalogView
        tenant={tenant}
        categories={categories}
        products={products}
        branches={branches}
        isAdmin={isAdmin}
      />
    </>
  );
}
