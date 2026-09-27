import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getAdminClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Manejador del intercambio de código OAuth de Supabase (PKCE Flow)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

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

      // 1. Si el destino es un panel administrativo de tienda (/store/[shopSlug]/admin)
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

      // 2. Si es un comprador B2B, registrar o vincular en b2b_accounts automáticamente
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

      // 3. Establecer cookie de sesión de comprador B2B
      cookieStore.set('tenddy_b2b_user', JSON.stringify({ email, name: fullName }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 días
        path: '/',
      });

      return NextResponse.redirect(`${origin}${next}`);
    } else if (error) {
      console.error('Error intercambiando código OAuth por sesión:', error.message);
    }
  }

  // Si hubo error, redirigir con parámetro
  return NextResponse.redirect(`${origin}/?auth_error=google_failed`);
}
