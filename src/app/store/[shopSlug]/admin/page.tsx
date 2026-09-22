import { notFound } from 'next/navigation';
import { getTenantByHostOrSlug, getTenantCatalog } from '@/lib/tenant';
import { getAdminClient } from '@/lib/supabase';
import AdminDashboardView, { QuoteRecord } from '@/components/AdminDashboardView';

interface AdminPageProps {
  params: Promise<{
    shopSlug: string;
  }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const resolvedParams = await params;
  const shopSlug = resolvedParams.shopSlug;

  const tenant = await getTenantByHostOrSlug(shopSlug);
  if (!tenant) {
    notFound();
  }

  const { products, branches } = await getTenantCatalog(tenant.id);

  // Cargar cotizaciones desde Supabase
  const admin = getAdminClient();
  const { data: quotesData } = await admin
    .from('quotes')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  const quotes = (quotesData || []) as QuoteRecord[];

  return (
    <AdminDashboardView
      tenant={tenant}
      branches={branches}
      products={products}
      initialQuotes={quotes}
    />
  );
}
