import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { createTenantAdminToken } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Protección anti-fuerza bruta: máximo 10 intentos cada 5 minutos por IP
    const { isAllowed, remaining } = checkRateLimit(`login_${clientIp}`, {
      windowMs: 5 * 60 * 1000,
      maxRequests: 10,
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos fallidos. Bloqueado temporalmente por seguridad.' },
        { status: 429 }
      );
    }

    const { password, shopSlug } = await request.json();

    if (!shopSlug || typeof shopSlug !== 'string' || !/^[a-z0-9-]+$/i.test(shopSlug.trim())) {
      return NextResponse.json({ error: 'Identificador de tienda inválido' }, { status: 400 });
    }

    const cleanSlug = shopSlug.trim().toLowerCase();

    // Verificación estricta de secreto: no permitir fallback inseguro en producción
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    if (!adminSecret && process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: ADMIN_SECRET_KEY no configurado en producción.');
      return NextResponse.json(
        { error: 'Error de configuración de seguridad del servidor' },
        { status: 500 }
      );
    }

    const effectiveSecret = adminSecret || 'tenddy2026';

    if (!password || password !== effectiveSecret) {
      return NextResponse.json(
        { error: `Clave incorrecta. Intentos restantes: ${remaining}` },
        { status: 401 }
      );
    }

    // Cookie segura de sesión firmada criptográficamente con HMAC-SHA256
    const cookieStore = await cookies();
    const token = createTenantAdminToken(cleanSlug);
    cookieStore.set(`admin_session_${cleanSlug}`, token, {
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

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get('shopSlug') || '';
  const cleanSlug = rawSlug.trim().toLowerCase();

  const cookieStore = await cookies();
  if (cleanSlug) {
    cookieStore.delete({ name: `admin_session_${cleanSlug}`, path: '/' });
  }
  cookieStore.delete({ name: 'tenddy_superadmin_session', path: '/' });

  cookieStore.getAll().forEach((c) => {
    if (c.name.startsWith('sb-') || c.name.startsWith('admin_session_') || c.name.startsWith('tenddy_')) {
      cookieStore.delete({ name: c.name, path: '/' });
    }
  });

  return NextResponse.json({ success: true });
}
