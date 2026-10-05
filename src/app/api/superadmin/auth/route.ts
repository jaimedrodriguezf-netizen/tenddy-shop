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

    // Verificación estricta de secreto: no permitir fallback inseguro en producción
    const platformSecret = process.env.SUPERADMIN_SECRET_KEY;
    if (!platformSecret && process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: SUPERADMIN_SECRET_KEY no configurado en producción.');
      return NextResponse.json(
        { error: 'Error de configuración de seguridad del servidor' },
        { status: 500 }
      );
    }

    const effectiveSecret = platformSecret || 'tenddy_master_2026';

    if (!secretKey || secretKey !== effectiveSecret) {
      return NextResponse.json({ error: 'Clave maestra de plataforma inválida' }, { status: 401 });
    }

    // Cookie segura de sesión exclusiva de plataforma (path: '/' para cubrir /superadmin y /api/superadmin/*)
    const cookieStore = await cookies();
    cookieStore.set('tenddy_superadmin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: 'tenddy_superadmin_session', path: '/' });
  return NextResponse.json({ success: true });
}
