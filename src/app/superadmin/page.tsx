import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';
import SuperadminDashboardView, { SuperadminTenantSummary } from '@/components/SuperadminDashboardView';
import SuperadminLoginForm from '@/components/SuperadminLoginForm';
import { B2BAccount, TenantStaffMember } from '@/components/SuperadminUsersManager';
import { SupportTicketRecord } from '@/components/SuperadminSupportManager';

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

  // Consultar métricas, usuarios y tickets de soporte en paralelo
  const [tenantsRes, quotesRes, productsRes, accountsRes, staffRes, ticketsRes] = await Promise.all([
    admin.from('tenants').select('id, slug, name, industry_type, is_active, views_count, created_at').order('created_at', { ascending: false }),
    admin.from('quotes').select('id, tenant_id, estimated_total, items'),
    admin.from('products').select('id, tenant_id'),
    admin.from('b2b_accounts').select('*').order('created_at', { ascending: false }),
    admin.from('tenant_members').select('*, tenants(name, slug)').order('created_at', { ascending: false }),
    admin.from('support_tickets').select('*, tenants(name, slug)').order('created_at', { ascending: false }),
  ]);

  const rawTenants = tenantsRes.data || [];
  const rawQuotes = quotesRes.data || [];
  const rawProducts = productsRes.data || [];
  const rawBuyers = (accountsRes.data || []) as B2BAccount[];
  const rawStaff = (staffRes.data || []) as TenantStaffMember[];
  const rawTickets = (ticketsRes.data || []) as SupportTicketRecord[];

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
      views_count: t.views_count || 0,
      created_at: t.created_at,
      total_products: tenantProducts.length,
      total_quotes: tenantQuotes.length,
      total_branches: 1,
      total_members: 1,
    };
  });

  const totalGlobalQuotes = rawQuotes.length;
  const totalGlobalProducts = rawProducts.length;
  const totalB2BAccounts = rawBuyers.length;
  const totalGlobalViews = rawTenants.reduce((acc, t: any) => acc + (t.views_count || 0), 0);
  const totalGlobalUnitsQuoted = rawQuotes.reduce((acc, q: any) => {
    const items = q.items || [];
    return acc + items.reduce((sub: number, i: any) => sub + (i.total_units || 0), 0);
  }, 0);

  return (
    <SuperadminDashboardView
      tenants={tenantsSummary}
      totalGlobalViews={totalGlobalViews}
      totalGlobalQuotes={totalGlobalQuotes}
      totalGlobalProducts={totalGlobalProducts}
      totalGlobalUnitsQuoted={totalGlobalUnitsQuoted}
      totalB2BAccounts={totalB2BAccounts}
      initialBuyers={rawBuyers}
      initialStaff={rawStaff}
      initialTickets={rawTickets}
    />
  );
}
