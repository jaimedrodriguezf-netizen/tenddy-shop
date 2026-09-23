import { notFound } from 'next/navigation';
import { getTenantByHostOrSlug, getTenantCatalog } from '@/lib/tenant';
import TenantLandingView from '@/components/TenantLandingView';
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

  // Para AYME INDUSTRIAS PET servimos la réplica exacta en iframe 100% aislado
  if (tenant.slug === 'ayme-pet' || tenant.slug === 'plastpet') {
    return (
      <>
        <ViewTracker tenantId={tenant.id} />
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

  // Para otros tenants (como Dulcelandia), usamos la vista modular dinámica
  const { categories, products, branches } = await getTenantCatalog(tenant.id);

  return (
    <>
      <ViewTracker tenantId={tenant.id} />
      <TenantLandingView
        tenant={tenant}
        categories={categories}
        products={products}
        branches={branches}
      />
    </>
  );
}
