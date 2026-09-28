import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getAdminClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Manejador del intercambio de código OAuth de Supabase (PKCE Flow)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  // Normalizar origin para evitar 0.0.0.0 o esquemas caídos en localhost
  let safeOrigin = url.origin;
  if (safeOrigin.includes('0.0.0.0')) {
    safeOrigin = safeOrigin.replace('0.0.0.0', 'localhost').replace('https://', 'http://');
  }

  if (code) {
    const cookieStore = await cookies();
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
              // Contexto de Route Handler permite setAll
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session && data?.user) {
      const email = data.user.email?.toLowerCase();
      const fullName = data.user.user_metadata?.full_name || email?.split('@')[0] || 'Usuario Google';

      const admin = getAdminClient();

      // 1. Si el destino es /admin (Acceso inteligente automático desde el botón Admin)
      // Detectar automáticamente a qué tienda pertenece este usuario en tenant_members
      if (email && (next === '/admin' || next.startsWith('/admin'))) {
        const { data: userMemberships } = await admin
          .from('tenant_members')
          .select('id, role, is_active, tenant_id, tenants(id, slug, name, is_active)')
          .eq('email', email)
          .eq('is_active', true);

        if (userMemberships && userMemberships.length > 0) {
          // Tomar la primera tienda asignada activa
          const targetStore = (userMemberships[0] as unknown as { tenants: { slug: string; name: string } })?.tenants;
          if (targetStore && targetStore.slug) {
            cookieStore.set(`admin_session_${targetStore.slug}`, 'authenticated', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7,
              path: '/',
            });
            return NextResponse.redirect(`${safeOrigin}/store/${targetStore.slug}/admin`);
          }
        }

        // Si no tiene ninguna tienda asignada, llevarlo al Onboarding (/registro) para crearla
        return NextResponse.redirect(`${safeOrigin}/registro`);
      }

      // 2. Si el destino es un panel administrativo de tienda específico (/store/[shopSlug]/admin)
      // Verificar si el usuario autenticado con Google es un miembro activo registrado de esa tienda
      if (next.startsWith('/store/') && next.includes('/admin')) {
        const slugMatch = next.match(/\/store\/([^/]+)\/admin/);
        if (slugMatch && slugMatch[1]) {
          const targetSlug = slugMatch[1].toLowerCase();
          const { data: tenant } = await admin
            .from('tenants')
            .select('id, slug')
            .eq('slug', targetSlug)
            .single();

          if (tenant && email) {
            const { data: member } = await admin
              .from('tenant_members')
              .select('id, role, is_active')
              .eq('tenant_id', tenant.id)
              .eq('email', email)
              .eq('is_active', true)
              .single();

            if (member) {
              // Otorgar sesión administrativa segura para esta tienda
              cookieStore.set(`admin_session_${targetSlug}`, 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
              });
            }
          }
        }
      }

      // 3. Si es un comprador B2B, registrar o vincular en b2b_accounts automáticamente
      if (email) {
        const { data: existingAccount } = await admin
          .from('b2b_accounts')
          .select('id')
          .eq('email', email)
          .single();

        if (!existingAccount) {
          await admin.from('b2b_accounts').insert({
            company_name: fullName,
            email,
            phone: data.user.phone || 'Pendiente',
            is_active: true,
          });
        }
      }

      // 4. Establecer cookie de sesión de comprador B2B
      cookieStore.set('tenddy_b2b_user', JSON.stringify({ email, name: fullName }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 días
        path: '/',
      });

      return NextResponse.redirect(`${safeOrigin}${next}`);
    } else if (error) {
      console.error('Error intercambiando código OAuth por sesión:', error.message);
    }
  }

  // Si hubo error, redirigir con parámetro
  return NextResponse.redirect(`${safeOrigin}/?auth_error=google_failed`);
}
