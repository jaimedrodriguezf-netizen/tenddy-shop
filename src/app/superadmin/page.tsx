import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';
import { verifySuperadminToken } from '@/lib/session';
import SuperadminDashboardView, { SuperadminTenantSummary } from '@/components/SuperadminDashboardView';
import SuperadminLoginForm from '@/components/SuperadminLoginForm';
import { B2BAccount, TenantStaffMember } from '@/components/SuperadminUsersManager';
import { SupportTicketRecord } from '@/components/SuperadminSupportManager';
import { DEFAULT_PLANS } from '@/lib/plans';
import { Plan } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Torre de Control Superadmin | tenddy',
  description: 'Panel de control global para el propietario del SaaS tenddy',
};

async function loadSuperadminData() {
  try {
    const admin = getAdminClient();

    // Consultar métricas, usuarios, productos con imágenes, dominios, tickets y planes en paralelo
    const [tenantsRes, quotesRes, productsRes, accountsRes, staffRes, ticketsRes, storageRes, domainsRes, plansRes] = await Promise.all([
      admin.from('tenants').select('id, slug, name, industry_type, is_active, views_count, created_at, theme_config, plan_slug, plan_status').order('created_at', { ascending: false }),
      admin.from('quotes').select('id, tenant_id, estimated_total, items'),
      admin.from('products').select('id, tenant_id, images'),
      admin.from('b2b_accounts').select('*').order('created_at', { ascending: false }),
      admin.from('tenant_members').select('*, tenants(name, slug)').order('created_at', { ascending: false }),
      admin.from('support_tickets').select('*, tenants(name, slug)').order('created_at', { ascending: false }),
      admin.storage.from('support-attachments').list('', { limit: 1000 }).catch(() => ({ data: [] })),
      admin.from('tenant_domains').select('tenant_id, domain, is_primary'),
      admin.from('plans').select('*').order('sort_order', { ascending: true }),
    ]);

    const rawTenants = (tenantsRes as any)?.data || [];
    const rawQuotes = quotesRes.data || [];
    const rawProducts = productsRes.data || [];
    const rawBuyers = (accountsRes.data || []) as B2BAccount[];
    const rawStaff = (staffRes.data || []) as TenantStaffMember[];
    const rawTickets = (ticketsRes.data || []) as SupportTicketRecord[];
    const rawStorageFiles = (storageRes && 'data' in storageRes && Array.isArray(storageRes.data)) ? storageRes.data : [];
    const rawDomains = domainsRes?.data || [];
    const rawPlans = (plansRes as any)?.data || [];

    // Mapear planes con fallback defensivo al catálogo por defecto
    const initialPlans: Plan[] = (Array.isArray(rawPlans) && rawPlans.length > 0)
      ? rawPlans.map((p: any) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description || '',
          price_monthly: Number(p.price_monthly) || 0,
          price_yearly: Number(p.price_yearly) || 0,
          currency: p.currency || 'USD',
          badge: p.badge || '',
          sort_order: Number(p.sort_order) || 0,
          is_active: Boolean(p.is_active),
          is_public: Boolean(p.is_public),
          features: Array.isArray(p.features) ? p.features : [],
          limits: typeof p.limits === 'object' && p.limits !== null ? p.limits : DEFAULT_PLANS[0].limits,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }))
      : DEFAULT_PLANS;

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
    const tenantsSummary: SuperadminTenantSummary[] = rawTenants.map((t: any) => {
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
        store_template: (t.theme_config as any)?.store_template || 'temu',
        custom_landing_unlocked: Boolean((t.theme_config as any)?.custom_landing_unlocked),
        plan_slug: (t as any).plan_slug || 'starter',
        plan_status: (t as any).plan_status || 'active',
      };
    });

    const totalGlobalQuotes = rawQuotes.length;
    const totalGlobalProducts = rawProducts.length;
    const totalB2BAccounts = rawBuyers.length;
    const totalStorageFiles = rawStorageFiles.length;
    const totalGlobalViews = rawTenants.reduce((acc: number, t: any) => acc + (Number(t.views_count) || 0), 0);
    const totalGlobalUnitsQuoted = rawQuotes.reduce((acc: number, q: any) => {
      const items = Array.isArray(q.items) ? q.items : [];
      return acc + items.reduce((sub: number, i: any) => sub + (Number(i?.total_units) || 0), 0);
    }, 0);

    const staffWithMetrics: TenantStaffMember[] = rawStaff.map((s: any) => {
      const tenantProducts = rawProducts.filter((p: any) => p.tenant_id === s.tenant_id);
      const tenantImages = imagesByTenant[s.tenant_id] || 0;
      return {
        ...s,
        total_products: tenantProducts.length,
        total_images: tenantImages,
        primary_domain: domainsByTenant[s.tenant_id] || (s.tenants?.slug ? `${s.tenants.slug}.tenddy.shop` : undefined),
      };
    });

    return {
      tenants: tenantsSummary,
      totalGlobalViews,
      totalGlobalQuotes,
      totalGlobalProducts,
      totalGlobalImages,
      totalStorageFiles,
      totalGlobalUnitsQuoted,
      totalB2BAccounts,
      initialBuyers: rawBuyers,
      initialStaff: staffWithMetrics,
      initialTickets: rawTickets,
      initialPlans,
    };
  } catch (err: unknown) {
    console.error('Error cargando datos de Torre de Control Superadmin:', err);
    return null;
  }
}

export default async function SuperadminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tenddy_superadmin_session');
  const isAuthenticated = verifySuperadminToken(sessionCookie?.value);

  if (!isAuthenticated) {
    return <SuperadminLoginForm onSuccess={() => {}} />;
  }

  const data = await loadSuperadminData();

  if (!data) {
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
        </div>
      </div>
    );
  }

  return (
    <SuperadminDashboardView
      tenants={data.tenants}
      totalGlobalViews={data.totalGlobalViews}
      totalGlobalQuotes={data.totalGlobalQuotes}
      totalGlobalProducts={data.totalGlobalProducts}
      totalGlobalImages={data.totalGlobalImages}
      totalStorageFiles={data.totalStorageFiles}
      totalGlobalUnitsQuoted={data.totalGlobalUnitsQuoted}
      totalB2BAccounts={data.totalB2BAccounts}
      initialBuyers={data.initialBuyers}
      initialStaff={data.initialStaff}
      initialTickets={data.initialTickets}
      initialPlans={data.initialPlans}
    />
  );
}
