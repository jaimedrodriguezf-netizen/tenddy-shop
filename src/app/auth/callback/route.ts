import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Manejador del intercambio de código OAuth de Supabase
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  if (code) {
    const admin = getAdminClient();
    const { data, error } = await admin.auth.exchangeCodeForSession(code);

    if (!error && data.session && data.user) {
      // 1. Si es un comprador B2B, registrar o vincular en b2b_accounts automáticamente
      const email = data.user.email?.toLowerCase();
      const fullName = data.user.user_metadata?.full_name || email?.split('@')[0] || 'Usuario Google';

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

      // 2. Establecer cookie de sesión segura
      const cookieStore = await cookies();
      cookieStore.set('tenddy_b2b_user', JSON.stringify({ email, name: fullName }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 días
        path: '/',
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si hubo error, redirigir con parámetro
  return NextResponse.redirect(`${origin}/?auth_error=google_failed`);
}
