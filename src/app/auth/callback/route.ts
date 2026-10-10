import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getAdminClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createTenantAdminToken } from '@/lib/session';

// Helper para calcular el origen público real detrás de proxies inversos con Whitelist estricta contra Host Header Injection (CWE-644)
function getSafeOrigin(request: Request): string {
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'tenddy.shop').toLowerCase();
  const defaultOrigin = process.env.NODE_ENV === 'production' 
    ? `https://${rootDomain}` 
    : 'http://localhost:3000';

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = (forwardedHost || request.headers.get('host') || '').trim().toLowerCase();

  if (!host) {
    return defaultOrigin;
  }

  // Whitelist estricta de dominios autorizados de la plataforma:
  // 1. Dominio raíz y subdominios oficiales de producción (tenddy.shop / *.tenddy.shop)
  // 2. Previews oficiales de Vercel (*.vercel.app)
  // 3. Entornos de desarrollo local autorizados
  const isAllowedHost =
    host === rootDomain ||
    host.endsWith(`.${rootDomain}`) ||
    host === 'tenddy.shop' ||
    host.endsWith('.tenddy.shop') ||
    host.endsWith('.vercel.app') ||
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host === '127.0.0.1' ||
    host.startsWith('127.0.0.1:') ||
    (process.env.NODE_ENV !== 'production' && (host.startsWith('100.') || host.startsWith('192.168.')));

  if (!isAllowedHost) {
    console.warn(`Host Header sospechoso o no autorizado rechazado en OAuth callback: ${host}`);
    return defaultOrigin;
  }

  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const proto = forwardedProto || (process.env.NODE_ENV === 'production' || !isLocal ? 'https' : 'http');

  return `${proto}://${host}`;
}

// Helper defensivo para prevenir vulnerabilidades de Redirección Abierta (Open Redirect - CWE-601)
function getSafeNextPath(rawNext: string | null): string {
  if (!rawNext || typeof rawNext !== 'string') return '/';
  const trimmed = rawNext.trim();

  // Debe comenzar estrictamente con una sola barra diagonal y no contener esquemas ni saltos de host
  // Rechaza: '//attacker.com', '/\attacker.com', '/@attacker.com', 'javascript:', 'https:'
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.includes('@') ||
    trimmed.includes('\\') ||
    trimmed.includes(':')
  ) {
    return '/';
  }

  return trimmed;
}

// Manejador del intercambio de código OAuth de Supabase (PKCE Flow)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = getSafeNextPath(url.searchParams.get('next'));

  const safeOrigin = getSafeOrigin(request);

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
            const redirectRes = NextResponse.redirect(`${safeOrigin}/store/${targetStore.slug}/admin`);
            const token = createTenantAdminToken(targetStore.slug);
            redirectRes.cookies.set(`admin_session_${targetStore.slug}`, token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 30,
              path: '/',
            });
            return redirectRes;
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
              const redirectRes = NextResponse.redirect(`${safeOrigin}${next}`);
              const token = createTenantAdminToken(targetSlug, tenant.id);
              redirectRes.cookies.set(`admin_session_${targetSlug}`, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
              });
              return redirectRes;
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

      // 4. Establecer cookie de sesión de comprador B2B y redirigir
      const finalRes = NextResponse.redirect(`${safeOrigin}${next}`);
      finalRes.cookies.set('tenddy_b2b_user', JSON.stringify({ email, name: fullName }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 días
        path: '/',
      });

      return finalRes;
    } else if (error) {
      console.error('Error intercambiando código OAuth por sesión:', error.message);
    }
  }

  // Si hubo error, redirigir con parámetro
  return NextResponse.redirect(`${safeOrigin}/?auth_error=google_failed`);
}
