import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getTenantByHostOrSlug, getTenantCatalog } from '@/lib/tenant';
import { getAdminClient } from '@/lib/supabase';
import { verifySuperadminToken, verifyTenantAdminToken, createTenantAdminToken } from '@/lib/session';
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

  const cookieStore = await cookies();

  // 1. Verificación primaria: Cookie de sesión de tienda o Superadmin (validación criptográfica)
  const sessionCookie = cookieStore.get(`admin_session_${tenant.slug}`);
  const isSuperadmin = verifySuperadminToken(cookieStore.get('tenddy_superadmin_session')?.value);
  let isAuthenticated = verifyTenantAdminToken(sessionCookie?.value, tenant.slug) || isSuperadmin;

  // 2. Verificación Dual de Respaldo: Sesión persistente de Google / Supabase Auth
  // Si el usuario dio "Atrás" en el navegador o la cookie temporal se perdió, validamos su sesión de Google
  if (!isAuthenticated) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Server Component
              }
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const admin = getAdminClient();
        const { data: membership } = await admin
          .from('tenant_members')
          .select('id, role, is_active')
          .eq('tenant_id', tenant.id)
          .eq('email', user.email.toLowerCase())
          .eq('is_active', true)
          .single();

        if (membership) {
          isAuthenticated = true;
          // Reactivar la cookie con token firmado por 30 días para que la sesión sea permanente
          const token = createTenantAdminToken(tenant.slug, tenant.id);
          cookieStore.set(`admin_session_${tenant.slug}`, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 días
            path: '/',
          });
        }
      }
    } catch (err) {
      console.error('Error validando sesión persistente:', err);
    }
  }

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
