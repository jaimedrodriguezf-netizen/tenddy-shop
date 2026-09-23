import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTenantByHostOrSlug, getTenantCatalog } from '@/lib/tenant';
import { getAdminClient } from '@/lib/supabase';
import { QuoteRecord } from '@/components/AdminDashboardView';
import { TenantMember } from '@/components/TeamTab';
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

  const { products, branches, categories } = await getTenantCatalog(tenant.id);

  // Si está autenticado, cargamos las cotizaciones y miembros de forma segura con el service role
  let quotes: QuoteRecord[] = [];
  let members: TenantMember[] = [];

  if (isAuthenticated) {
    const admin = getAdminClient();
    const [quotesRes, membersRes] = await Promise.all([
      admin
        .from('quotes')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false }),
      admin
        .from('tenant_members')
        .select('id, full_name, email, phone, role, is_active, created_at, branch_id')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: true }),
    ]);

    quotes = (quotesRes.data || []) as QuoteRecord[];
    members = (membersRes.data || []) as TenantMember[];
  }

  return (
    <AdminAuthWrapper
      shopSlug={shopSlug}
      tenant={tenant}
      branches={branches}
      products={products}
      categories={categories}
      initialQuotes={quotes}
      initialMembers={members}
      initiallyAuthenticated={isAuthenticated}
    />
  );
}
