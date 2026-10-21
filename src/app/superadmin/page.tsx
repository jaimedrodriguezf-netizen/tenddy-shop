import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';
import { verifySuperadminToken } from '@/lib/session';
import SuperadminDashboardView, { SuperadminTenantSummary } from '@/components/SuperadminDashboardView';
import SuperadminLoginForm from '@/components/SuperadminLoginForm';
import { B2BAccount, TenantStaffMember } from '@/components/SuperadminUsersManager';
import { SupportTicketRecord } from '@/components/SuperadminSupportManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Torre de Control Superadmin | tenddy',
  description: 'Panel de control global para el propietario del SaaS tenddy',
};

export default async function SuperadminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tenddy_superadmin_session');
  const isAuthenticated = verifySuperadminToken(sessionCookie?.value);

  if (!isAuthenticated) {
    return <SuperadminLoginForm onSuccess={() => {}} />;
  }

  try {
    const admin = getAdminClient();

    // Consultar métricas, usuarios, productos con imágenes, dominios y tickets de soporte en paralelo
    const [tenantsRes, quotesRes, productsRes, accountsRes, staffRes, ticketsRes, storageRes, domainsRes] = await Promise.all([
      admin.from('tenants').select('id, slug, name, industry_type, is_active, views_count, created_at, theme_config').order('created_at', { ascending: false }),
      admin.from('quotes').select('id, tenant_id, estimated_total, items'),
      admin.from('products').select('id, tenant_id, images'),
      admin.from('b2b_accounts').select('*').order('created_at', { ascending: false }),
      admin.from('tenant_members').select('*, tenants(name, slug)').order('created_at', { ascending: false }),
      admin.from('support_tickets').select('*, tenants(name, slug)').order('created_at', { ascending: false }),
      admin.storage.from('support-attachments').list('', { limit: 1000 }).catch(() => ({ data: [] })),
      admin.from('tenant_domains').select('tenant_id, domain, is_primary'),
    ]);

    const rawTenants = tenantsRes.data || [];
    const rawQuotes = quotesRes.data || [];
    const rawProducts = productsRes.data || [];
    const rawBuyers = (accountsRes.data || []) as B2BAccount[];
    const rawStaff = (staffRes.data || []) as TenantStaffMember[];
    const rawTickets = (ticketsRes.data || []) as SupportTicketRecord[];
    const rawStorageFiles = (storageRes && 'data' in storageRes && Array.isArray(storageRes.data)) ? storageRes.data : [];
    const rawDomains = domainsRes?.data || [];

    // Mapear dominios públicos principales por tenant
    const domainsByTenant: Record<string, string> = {};
    rawDomains.forEach((d: any) => {
      if (d.is_primary) {
        domainsByTenant[d.tenant_id] = d.domain;
      } else if (!domainsByTenant[d.tenant_id]) {
        domainsByTenant[d.tenant_id] = d.domain;
      }
    });

    // Calcular desglose de imágenes por producto y tenant
    let totalGlobalImages = 0;
    const imagesByTenant: Record<string, number> = {};

    rawProducts.forEach((p: any) => {
      const rawImgs = p.images;
      const imgList = Array.isArray(rawImgs) ? rawImgs : rawImgs ? [rawImgs] : [];
      const validImgs = imgList.filter(Boolean);
      const count = validImgs.length;
      totalGlobalImages += count;
      if (p.tenant_id) {
        imagesByTenant[p.tenant_id] = (imagesByTenant[p.tenant_id] || 0) + count;
      }
    });

    // Calcular métricas agregadas por tenant de forma defensiva
    const tenantsSummary: SuperadminTenantSummary[] = rawTenants.map((t) => {
      const tenantQuotes = rawQuotes.filter((q: any) => q.tenant_id === t.id);
      const tenantProducts = rawProducts.filter((p: any) => p.tenant_id === t.id);
      const tenantImages = imagesByTenant[t.id] || 0;

      return {
        id: t.id,
        slug: t.slug,
        name: t.name || 'Sin nombre',
        industry_type: t.industry_type || 'general',
        is_active: Boolean(t.is_active),
        views_count: Number(t.views_count) || 0,
        created_at: t.created_at || new Date().toISOString(),
        total_products: tenantProducts.length,
        total_images: tenantImages,
        total_quotes: tenantQuotes.length,
        total_branches: 1,
        total_members: 1,
        primary_domain: domainsByTenant[t.id] || `${t.slug}.tenddy.shop`,
        is_decoupled: Boolean((t.theme_config as any)?.is_decoupled),
        decoupled_url: (t.theme_config as any)?.decoupled_url || '',
      };
    });

    const totalGlobalQuotes = rawQuotes.length;
    const totalGlobalProducts = rawProducts.length;
    const totalB2BAccounts = rawBuyers.length;
    const totalStorageFiles = rawStorageFiles.length;
    const totalGlobalViews = rawTenants.reduce((acc, t: any) => acc + (Number(t.views_count) || 0), 0);
    const totalGlobalUnitsQuoted = rawQuotes.reduce((acc, q: any) => {
      const items = Array.isArray(q.items) ? q.items : [];
      return acc + items.reduce((sub: number, i: any) => sub + (Number(i?.total_units) || 0), 0);
    }, 0);

    return (
      <SuperadminDashboardView
        tenants={tenantsSummary}
        totalGlobalViews={totalGlobalViews}
        totalGlobalQuotes={totalGlobalQuotes}
        totalGlobalProducts={totalGlobalProducts}
        totalGlobalImages={totalGlobalImages}
        totalStorageFiles={totalStorageFiles}
        totalGlobalUnitsQuoted={totalGlobalUnitsQuoted}
        totalB2BAccounts={totalB2BAccounts}
        initialBuyers={rawBuyers}
        initialStaff={rawStaff}
        initialTickets={rawTickets}
      />
    );
  } catch (err: unknown) {
    console.error('Error cargando Torre de Control Superadmin:', err);
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            ⚠️
          </div>
          <h2 className="text-lg font-bold">Error temporal al conectar con la base de datos</h2>
          <p className="text-xs text-slate-400">
            No se pudieron recuperar las métricas en tiempo real. Por favor recargá la página.
          </p>
          <button
            onClick={() => {}}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
}
