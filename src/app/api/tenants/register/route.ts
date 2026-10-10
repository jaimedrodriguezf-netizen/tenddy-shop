import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { createTenantAdminToken } from '@/lib/session';

// Helper para formatear automáticamente teléfonos de Ecuador a formato internacional WhatsApp (+593)
function normalizeEcuadorPhone(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('5930')) {
    clean = '593' + clean.slice(4);
  } else if (clean.startsWith('09')) {
    clean = '593' + clean.slice(1);
  } else if (clean.startsWith('9') && clean.length === 9) {
    clean = '593' + clean;
  } else if (clean.startsWith('0') && clean.length === 10) {
    clean = '593' + clean.slice(1);
  } else if (!clean.startsWith('593')) {
    clean = '593' + clean;
  }
  return clean;
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate limiting: máximo 3 registros de empresas cada 10 minutos por IP
    const { isAllowed } = checkRateLimit(`register_${clientIp}`, {
      windowMs: 10 * 60 * 1000,
      maxRequests: 3,
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes de registro desde esta IP. Por favor espera unos minutos.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      companyName,
      slug,
      taxId,
      industryType,
      address,
      whatsapp,
      email,
      creatorName,
      logoData,
      primaryColor,
      _hp_check,
    } = body;

    // Honeypot anti-bots
    if (_hp_check) {
      return NextResponse.json({ success: true, redirectUrl: '/store/demo' });
    }

    // Validaciones (Subdominio ya no es obligatorio; se genera automáticamente)
    if (!companyName || !whatsapp) {
      return NextResponse.json(
        { error: 'El nombre de la empresa y el número de WhatsApp son requeridos.' },
        { status: 400 }
      );
    }

    // Sanitizar o generar slug automáticamente desde el nombre de la empresa
    let cleanSlug = (slug || companyName)
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);

    if (!cleanSlug || cleanSlug.length < 2) {
      cleanSlug = `tienda-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const reservedSlugs = ['admin', 'api', 'store', 'www', 'app', 'platform', 'registro', 'login', 'dashboard', 'tenddy'];
    if (reservedSlugs.includes(cleanSlug)) {
      cleanSlug = `${cleanSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const admin = getAdminClient();

    // 0. Si viene email de Google, verificar si ya tiene registrada una tienda con el mismo nombre o slug
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const { data: existingMemberships } = await admin
        .from('tenant_members')
        .select('tenant_id, role, tenants(id, slug, name, is_active)')
        .eq('email', cleanEmail)
        .eq('role', 'owner');

      if (existingMemberships && existingMemberships.length > 0) {
        for (const m of existingMemberships) {
          const t = m.tenants as unknown as { id: string; slug: string; name: string; is_active: boolean };
          if (t && t.is_active) {
            const normExisting = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normNew = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (normExisting === normNew || t.slug === cleanSlug) {
              return NextResponse.json(
                {
                  error: `Tu cuenta de Google ya tiene registrada la tienda "${t.name}". Puedes ingresar directamente a tu panel de administración.`,
                  adminUrl: `/store/${t.slug}/admin`,
                  redirectUrl: `/store/${t.slug}`,
                  existingStore: {
                    slug: t.slug,
                    name: t.name,
                  },
                },
                { status: 409 }
              );
            }
          }
        }
      }
    }

    // 1. Asignar slug único automáticamente sin fallar por duplicados
    const { data: existingTenant } = await admin
      .from('tenants')
      .select('id')
      .eq('slug', cleanSlug)
      .single();

    if (existingTenant) {
      cleanSlug = `${cleanSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // 2. Definir theming y copys base
    const color = primaryColor || '#0284c7';
    const effectiveIndustry = industryType || 'general';
    const heroTitle = `Catálogo Mayorista de ${companyName}`;
    const heroSubtitle = `Fabricación y distribución B2B directa con entregas a nivel nacional e internacional.`;

    // 2.1 Procesar y subir logotipo a Storage si se adjuntó
    let finalLogoUrl: string | null = null;
    if (logoData && typeof logoData === 'string' && logoData.startsWith('data:image')) {
      try {
        const matches = logoData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
          const buffer = Buffer.from(matches[2], 'base64');
          const filePath = `logos/${cleanSlug}-${Date.now()}.${ext}`;

          const { error: uploadErr } = await admin.storage
            .from('support-attachments')
            .upload(filePath, buffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (!uploadErr) {
            const { data: pubData } = admin.storage
              .from('support-attachments')
              .getPublicUrl(filePath);
            finalLogoUrl = pubData?.publicUrl || null;
          }
        }
      } catch (err) {
        console.error('Error subiendo logo de tenant:', err);
      }
    }

    const normalizedPhone = normalizeEcuadorPhone(whatsapp);

    // 3. Crear Tenant en Supabase
    const { data: tenant, error: tenantError } = await admin
      .from('tenants')
      .insert({
        slug: cleanSlug,
        name: companyName.trim(),
        tax_id: taxId ? taxId.trim().toUpperCase() : null,
        industry_type: effectiveIndustry,
        logo_url: finalLogoUrl,
        theme_config: {
          primary_color: color,
          secondary_color: '#0ea5e9',
          accent_color: '#10b981',
          font_family: 'Inter, sans-serif',
          border_radius: '0.5rem',
        },
        landing_config: {
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          hero_video_url: null,
          hero_image_url: null,
          whatsapp_default: normalizedPhone,
          display_phone: whatsapp.trim(),
          email: email || null,
          address: address ? address.trim() : 'Sede Principal',
          hours: 'Lunes a Viernes: 8:00 AM - 5:30 PM',
          plant_location: address ? address.trim() : 'Planta Principal',
          show_catalog: true,
          show_branches: true,
          show_services: false,
        },
        settings: {
          currency: 'USD',
          currency_symbol: '$',
          enable_whatsapp_rfq: true,
        },
        is_active: true,
      })
      .select('id, slug, name')
      .single();

    if (tenantError) {
      console.error('Error insertando tenant:', tenantError);
      return NextResponse.json({ error: tenantError.message }, { status: 500 });
    }

    // 4. Asignar Dominio Oficial
    await admin.from('tenant_domains').insert([
      {
        tenant_id: tenant.id,
        domain: `${cleanSlug}.tenddy.shop`,
        is_primary: true,
        is_verified: true,
      },
      {
        tenant_id: tenant.id,
        domain: `${cleanSlug}.localhost`,
        is_primary: false,
        is_verified: true,
      },
    ]);

    // 5. Crear Sucursal Matriz Inicial
    await admin.from('branches').insert({
      tenant_id: tenant.id,
      slug: 'sede-principal',
      name: 'Sede Principal',
      branch_type: 'plant',
      city: address ? address.trim() : 'Sede Principal',
      address: address ? address.trim() : 'Dirección Principal',
      phone_whatsapp: normalizedPhone,
      email: email || null,
      is_main_branch: true,
      is_active: true,
    });

    // 6. Crear Categoría Inicial Base Universal
    await admin.from('categories').insert([
      {
        tenant_id: tenant.id,
        slug: 'general',
        name: 'Catálogo General',
        sort_order: 0,
        is_active: true,
      },
    ]);

    // 7. Si viene email del creador autenticado con Google, registrarlo como Dueño (Owner)
    if (email) {
      await admin.from('tenant_members').insert({
        tenant_id: tenant.id,
        full_name: creatorName || companyName.trim(),
        email: email.trim().toLowerCase(),
        phone: whatsapp || null,
        password_hash: 'google_oauth_managed',
        role: 'owner',
        is_active: true,
      });

      // 8. Iniciar sesión administrativa con token firmado para el nuevo tenant
      const cookieStore = await cookies();
      const token = createTenantAdminToken(tenant.slug, tenant.id);
      cookieStore.set(`admin_session_${tenant.slug}`, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    return NextResponse.json({
      success: true,
      tenant: {
        slug: tenant.slug,
        name: tenant.name,
      },
      redirectUrl: `/store/${tenant.slug}`,
      adminUrl: `/store/${tenant.slug}/admin`,
    });
  } catch (err: any) {
    console.error('Excepción en /api/tenants/register:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
