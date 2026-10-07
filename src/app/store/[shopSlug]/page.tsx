import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { getTenantByHostOrSlug, getTenantCatalog } from '@/lib/tenant';
import TenantLandingView from '@/components/TenantLandingView';
import TenantCatalogView from '@/components/TenantCatalogView';
import ViewTracker from '@/components/ViewTracker';

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

  // Verificar si el visitante es el administrador o dueño de esta tienda
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(`admin_session_${tenant.slug}`);
  const isSuperadminCookie = cookieStore.get('tenddy_superadmin_session');
  const isAdmin = sessionCookie?.value === 'authenticated' || isSuperadminCookie?.value === 'authenticated';

  // Para AYME INDUSTRIAS PET servimos su landing oficial con diseño y colores corporativos
  if (tenant.slug === 'ayme-pet') {
    return (
      <>
        <ViewTracker tenantId={tenant.id} />
        {isAdmin && (
          <div className="fixed top-3 right-3 z-[10000] animate-fade-in">
            <Link
              href={`/store/${tenant.slug}/admin`}
              className="bg-slate-900/95 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105"
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              <span>Volver a Mi Panel</span>
            </Link>
          </div>
        )}
        <iframe
          src="/standalone.html"
          style={{
            width: '100vw',
            height: '100vh',
            border: 'none',
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
          }}
          title="AYME INDUSTRIAS PET"
        />
      </>
    );
  }

  // Cargar catálogo dinámico desde Supabase
  const { categories, products, branches } = await getTenantCatalog(tenant.id);
  const storeTemplate = (tenant.theme_config as any)?.store_template || 'catalog';

  if (storeTemplate === 'landing') {
    return (
      <>
        <ViewTracker tenantId={tenant.id} />
        {isAdmin && (
          <div className="fixed top-3 right-3 z-[10000] animate-fade-in">
            <Link
              href={`/store/${tenant.slug}/admin`}
              className="bg-slate-900/95 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105"
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              <span>Volver a Mi Panel</span>
            </Link>
          </div>
        )}
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
