import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getAdminClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Read-only endpoint
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ authenticated: false });
    }

    const email = user.email.toLowerCase();
    const name = user.user_metadata?.full_name || email.split('@')[0];
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    // Buscar si este usuario es dueño o miembro de alguna tienda
    const admin = getAdminClient();
    const { data: memberships } = await admin
      .from('tenant_members')
      .select('role, is_active, tenants(id, slug, name, logo_url)')
      .eq('email', email)
      .eq('is_active', true)
      .limit(1);

    const primaryTenant = memberships && memberships.length > 0
      ? (memberships[0] as unknown as { tenants: { id: string; slug: string; name: string; logo_url?: string } })?.tenants
      : null;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email,
        name,
        avatarUrl,
        storeSlug: primaryTenant?.slug || null,
        storeName: primaryTenant?.name || null,
        role: memberships?.[0]?.role || 'buyer',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ authenticated: false, error: errorMsg });
  }
}
