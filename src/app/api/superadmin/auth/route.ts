import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { createSuperadminToken, constantTimeCompare } from '@/lib/session';
import { getAdminClient } from '@/lib/supabase';

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

    const body = await request.json();
    const { secretKey, email, password } = body;

    let isAuthorized = false;

    // Camino 1: Autenticación por Correo y Contraseña
    if (email && password) {
      const cleanEmail = String(email).trim().toLowerCase();
      const admin = getAdminClient();

      const { data: authData, error: authErr } = await admin.auth.signInWithPassword({
        email: cleanEmail,
        password: String(password),
      });

      if (authErr || !authData?.user) {
        return NextResponse.json({ error: 'Credenciales de Superadmin incorrectas' }, { status: 401 });
      }

      const isSuperadminUser =
        cleanEmail === 'jaimedrodriguezf@gmail.com' ||
        authData.user.app_metadata?.role === 'superadmin' ||
        authData.user.user_metadata?.role === 'superadmin';

      if (!isSuperadminUser) {
        return NextResponse.json(
          { error: 'Tu cuenta no tiene privilegios de Superadmin en Tenddy' },
          { status: 403 }
        );
      }

      isAuthorized = true;
    }
    // Camino 2: Clave Maestra de Plataforma (acceso de emergencia / recuperación)
    else if (secretKey) {
      const platformSecret = process.env.SUPERADMIN_SECRET_KEY;
      if (!platformSecret && process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: SUPERADMIN_SECRET_KEY no configurado en producción.');
        return NextResponse.json(
          { error: 'Error de configuración de seguridad del servidor' },
          { status: 500 }
        );
      }

      const effectiveSecret = platformSecret || 'tenddy_master_2026';

      if (!constantTimeCompare(secretKey, effectiveSecret)) {
        return NextResponse.json({ error: 'Clave maestra de plataforma inválida' }, { status: 401 });
      }

      isAuthorized = true;
    } else {
      return NextResponse.json(
        { error: 'Debes proporcionar correo y contraseña o la clave maestra' },
        { status: 400 }
      );
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Cookie segura de sesión exclusiva de plataforma (firmada con HMAC-SHA256)
    const cookieStore = await cookies();
    const token = createSuperadminToken();
    cookieStore.set('tenddy_superadmin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Excepción en POST /api/superadmin/auth:', err);
    return NextResponse.json({ error: 'Error del servidor al procesar la autenticación' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: 'tenddy_superadmin_session', path: '/' });
  return NextResponse.json({ success: true });
}
