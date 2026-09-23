import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';
import SuperadminDashboardView, { SuperadminTenantSummary } from '@/components/SuperadminDashboardView';
import SuperadminLoginForm from '@/components/SuperadminLoginForm';

export const metadata = {
  title: 'Torre de Control Superadmin | tenddy.shop',
  description: 'Panel de control global para el propietario del SaaS tenddy.shop',
};

export default async function SuperadminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tenddy_superadmin_session');
  const isAuthenticated = sessionCookie?.value === 'authenticated';

  if (!isAuthenticated) {
    return <SuperadminLoginForm onSuccess={() => {}} />;
  }

  const admin = getAdminClient();

  // Consultar métricas globales en paralelo
  const [tenantsRes, quotesRes, productsRes, accountsRes] = await Promise.all([
    admin.from('tenants').select('id, slug, name, industry_type, is_active, created_at').order('created_at', { ascending: false }),
    admin.from('quotes').select('id, estimated_total, items'),
    admin.from('products').select('id, tenant_id'),
    admin.from('b2b_accounts').select('id'),
  ]);

  const rawTenants = tenantsRes.data || [];
  const rawQuotes = quotesRes.data || [];
  const rawProducts = productsRes.data || [];

  // Calcular métricas agregadas por tenant
  const tenantsSummary: SuperadminTenantSummary[] = rawTenants.map((t) => {
    const tenantQuotes = rawQuotes.filter((q: any) => q.tenant_id === t.id);
    const tenantProducts = rawProducts.filter((p: any) => p.tenant_id === t.id);

    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      industry_type: t.industry_type,
      is_active: t.is_active,
      created_at: t.created_at,
      total_products: tenantProducts.length,
      total_quotes: tenantQuotes.length,
      total_branches: 1,
      total_members: 1,
    };
  });

  const totalGlobalQuotes = rawQuotes.length;
  const totalGlobalProducts = rawProducts.length;
  const totalB2BAccounts = accountsRes.data?.length || 0;
  const totalGlobalUnitsQuoted = rawQuotes.reduce((acc, q: any) => {
    const items = q.items || [];
    return acc + items.reduce((sub: number, i: any) => sub + (i.total_units || 0), 0);
  }, 0);

  return (
    <SuperadminDashboardView
      tenants={tenantsSummary}
      totalGlobalQuotes={totalGlobalQuotes}
      totalGlobalProducts={totalGlobalProducts}
      totalGlobalUnitsQuoted={totalGlobalUnitsQuoted}
      totalB2BAccounts={totalB2BAccounts}
    />
  );
}
