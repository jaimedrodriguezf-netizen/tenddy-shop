import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { createTenantAdminToken, constantTimeCompare } from '@/lib/session';
import { verifyPassword } from '@/lib/passwords';

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

    const { password, shopSlug, email } = await request.json();

    if (!shopSlug || typeof shopSlug !== 'string' || !/^[a-z0-9-]+$/i.test(shopSlug.trim())) {
      return NextResponse.json({ error: 'Identificador de tienda inválido' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'La contraseña es requerida' }, { status: 400 });
    }

    const cleanSlug = shopSlug.trim().toLowerCase();
    const admin = getAdminClient();

    // 1. Obtener la tienda para aislar credenciales estrictamente a su tenant_id
    const { data: tenant, error: tenantErr } = await admin
      .from('tenants')
      .select('id, slug, name, settings, is_active')
      .eq('slug', cleanSlug)
      .single();

    if (tenantErr || !tenant) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    }

    if (!tenant.is_active) {
      return NextResponse.json({ error: 'Esta tienda se encuentra temporalmente inactiva' }, { status: 403 });
    }

    let isAuthorized = false;
    let authenticatedUserRole = 'admin';

    // 2. Aislamiento Multi-Tenant de Credenciales:
    // Camino A: Si el usuario suministró su correo de miembro del equipo
    if (email && typeof email === 'string' && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const { data: member } = await admin
        .from('tenant_members')
        .select('id, password_hash, role, is_active')
        .eq('tenant_id', tenant.id)
        .eq('email', cleanEmail)
        .eq('is_active', true)
        .single();

      if (member && member.password_hash) {
        isAuthorized = verifyPassword(password, member.password_hash);
        if (isAuthorized) {
          authenticatedUserRole = member.role;
        }
      }
    } else {
      // Camino B: Validar si la clave ingresada corresponde a algún miembro activo de este tenant específico
      const { data: members } = await admin
        .from('tenant_members')
        .select('id, password_hash, role')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);

      if (members && members.length > 0) {
        for (const m of members) {
          if (m.password_hash && verifyPassword(password, m.password_hash)) {
            isAuthorized = true;
            authenticatedUserRole = m.role;
            break;
          }
        }
      }

      // Camino C: Validar contra clave maestra aislada de la tienda si fue configurada en sus settings
      const tenantSettings = tenant.settings as Record<string, unknown> | null;
      if (!isAuthorized && tenantSettings && typeof tenantSettings.admin_password_hash === 'string') {
        isAuthorized = verifyPassword(password, tenantSettings.admin_password_hash);
      }

      // Camino D: Llave de soporte de la plataforma (Superadmin Master Key - Comparación constante)
      const platformSuperadminKey = process.env.SUPERADMIN_SECRET_KEY;
      if (!isAuthorized && platformSuperadminKey && constantTimeCompare(password, platformSuperadminKey)) {
        isAuthorized = true;
        authenticatedUserRole = 'superadmin';
      }

      // Camino E (Legacy sólo si ADMIN_SECRET_KEY está explícitamente en variables de entorno, sin fallback hardcodeado)
      const platformAdminKey = process.env.ADMIN_SECRET_KEY;
      if (!isAuthorized && platformAdminKey && constantTimeCompare(password, platformAdminKey)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: `Credenciales incorrectas para esta tienda. Intentos restantes: ${remaining}` },
        { status: 401 }
      );
    }

    // 3. Emitir cookie segura de sesión firmada criptográficamente con HMAC-SHA256
    const cookieStore = await cookies();
    const token = createTenantAdminToken(cleanSlug, tenant.id);
    cookieStore.set(`admin_session_${cleanSlug}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ success: true, role: authenticatedUserRole });
  } catch (err: unknown) {
    console.error('Excepción en POST /api/admin/auth:', err);
    return NextResponse.json({ error: 'Error del servidor al autenticar' }, { status: 500 });
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
