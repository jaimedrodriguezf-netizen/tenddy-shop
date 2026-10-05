import { notFound } from 'next/navigation';
import { getTenantByHostOrSlug, getTenantCatalog } from '@/lib/tenant';
import ProductDetailView from '@/components/ProductDetailView';
import ViewTracker from '@/components/ViewTracker';

interface ProductPageProps {
  params: Promise<{
    shopSlug: string;
    productSlug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const { shopSlug, productSlug } = resolvedParams;

  const tenant = await getTenantByHostOrSlug(shopSlug);
  if (!tenant) {
    notFound();
  }

  const { categories, products, branches } = await getTenantCatalog(tenant.id);
  const product = products.find(
    (p) => p.slug === productSlug || p.id === productSlug || p.sku?.toLowerCase() === productSlug.toLowerCase()
  );

  if (!product) {
    notFound();
  }

  return (
    <>
      <ViewTracker tenantId={tenant.id} />
      <ProductDetailView
        product={product}
        backHref={`/store/${tenant.slug}`}
        tenant={tenant}
        selectedBranch={branches[0] || null}
        branches={branches}
        categories={categories}
      />
    </>
  );
}
