import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTenantByHostOrSlug, getTenantCatalog } from '@/lib/tenant';
import { getAdminClient } from '@/lib/supabase';
import AdminDashboardView, { QuoteRecord } from '@/components/AdminDashboardView';
import AdminAuthWrapper from '@/components/AdminAuthWrapper';

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

  // Verificar cookie de sesión administrativa
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(`admin_session_${shopSlug}`);
  const isAuthenticated = sessionCookie?.value === 'authenticated';

  const { products, branches } = await getTenantCatalog(tenant.id);

  // Si está autenticado, cargamos las cotizaciones de forma segura con el service role
  let quotes: QuoteRecord[] = [];
  if (isAuthenticated) {
    const admin = getAdminClient();
    const { data: quotesData } = await admin
      .from('quotes')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    quotes = (quotesData || []) as QuoteRecord[];
  }

  return (
    <AdminAuthWrapper
      shopSlug={shopSlug}
      tenant={tenant}
      branches={branches}
      products={products}
      initialQuotes={quotes}
      initiallyAuthenticated={isAuthenticated}
    />
  );
}
