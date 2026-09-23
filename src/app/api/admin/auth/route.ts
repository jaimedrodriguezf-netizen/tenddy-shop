import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Protección anti-fuerza bruta: máximo 5 intentos de login cada 5 minutos por IP
    const { isAllowed, remaining } = checkRateLimit(`login_${clientIp}`, {
      windowMs: 5 * 60 * 1000, // 5 minutos
      maxRequests: 5,
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos fallidos. Bloqueado temporalmente por seguridad por 5 minutos.' },
        { status: 429 }
      );
    }

    const { password, shopSlug } = await request.json();
    const adminSecret = process.env.ADMIN_SECRET_KEY || 'tenddy2026';

    if (!password || password !== adminSecret) {
      return NextResponse.json(
        { error: `Clave incorrecta. Intentos restantes: ${remaining}` },
        { status: 401 }
      );
    }

    // Cookie segura de sesión
    const cookieStore = await cookies();
    cookieStore.set(`admin_session_${shopSlug}`, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: `/store/${shopSlug}/admin`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopSlug = searchParams.get('shopSlug') || '';
  const cookieStore = await cookies();
  cookieStore.delete(`admin_session_${shopSlug}`);
  return NextResponse.json({ success: true });
}
