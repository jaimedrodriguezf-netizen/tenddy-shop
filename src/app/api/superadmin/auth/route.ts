import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate limiting contra fuerza bruta al superadmin: max 5 intentos cada 15 min
    const { isAllowed } = checkRateLimit(`superadmin_login_${clientIp}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos fallidos en el acceso Superadmin. Bloqueado por 15 minutos.' },
        { status: 429 }
      );
    }

    const { secretKey } = await request.json();
    const platformSecret = process.env.SUPERADMIN_SECRET_KEY || 'tenddy_master_2026';

    if (!secretKey || secretKey !== platformSecret) {
      return NextResponse.json({ error: 'Clave maestra de plataforma inválida' }, { status: 401 });
    }

    // Cookie segura de sesión exclusiva de plataforma
    const cookieStore = await cookies();
    cookieStore.set('tenddy_superadmin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/superadmin',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: 'tenddy_superadmin_session', path: '/superadmin' });
  return NextResponse.json({ success: true });
}
