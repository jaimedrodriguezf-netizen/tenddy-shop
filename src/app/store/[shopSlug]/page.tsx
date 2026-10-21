import { notFound, redirect } from 'next/navigation';
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

  // Modo Desacoplado: Redirección hacia tienda externa o portal independiente
  const isDecoupled = Boolean((tenant.theme_config as any)?.is_decoupled);
  const rawDecoupledUrl = (tenant.theme_config as any)?.decoupled_url?.trim();
  const decoupledUrl = rawDecoupledUrl
    ? rawDecoupledUrl.startsWith('http://') || rawDecoupledUrl.startsWith('https://') || rawDecoupledUrl.startsWith('/')
      ? rawDecoupledUrl
      : `https://${rawDecoupledUrl}`
    : '';

  // Redireccionar visitantes públicos a la tienda personalizada dedicada
  if (isDecoupled && decoupledUrl && !isAdmin) {
    redirect(decoupledUrl);
  }

  // Banner informativo visible únicamente para administradores en tiendas desacopladas
  const decoupledAdminBanner = isDecoupled && decoupledUrl && isAdmin ? (
    <aside aria-label="Aviso de Modo Desacoplado" className="bg-amber-950/80 border-b border-amber-500/30 text-amber-200 text-xs py-2 px-4 flex items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded text-[10px]">
          Modo Desacoplado Activo
        </span>
        <span>
          Los clientes públicos son redirigidos a:{' '}
          <a
            href={decoupledUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-mono font-bold text-amber-300 hover:text-white"
          >
            {decoupledUrl}
          </a>
        </span>
      </div>
      <span className="text-[11px] text-amber-300/70 hidden sm:inline">
        Vista de auditoría administrativa
      </span>
    </aside>
  ) : null;

  // Cargar catálogo dinámico desde Supabase
  const { categories, products, branches } = await getTenantCatalog(tenant.id);
  const storeTemplate = (tenant.theme_config as any)?.store_template || 'catalog';

  if (storeTemplate === 'landing') {
    return (
      <>
        {decoupledAdminBanner}
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
      {decoupledAdminBanner}
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
