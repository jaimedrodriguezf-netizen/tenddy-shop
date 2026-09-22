import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { password, shopSlug } = await request.json();
    
    // Obtener la clave administrativa desde variable de entorno o fallback seguro
    const adminSecret = process.env.ADMIN_SECRET_KEY || 'tenddy2026';

    if (!password || password !== adminSecret) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Establecer cookie HttpOnly segura para la sesión administrativa
    const cookieStore = await cookies();
    cookieStore.set(`admin_session_${shopSlug}`, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días de sesión
      path: `/store/${shopSlug}/admin`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Cerrar sesión
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopSlug = searchParams.get('shopSlug') || '';
  const cookieStore = await cookies();
  cookieStore.delete(`admin_session_${shopSlug}`);
  return NextResponse.json({ success: true });
}
