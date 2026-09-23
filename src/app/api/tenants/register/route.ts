import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

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
      industryType,
      city,
      address,
      whatsapp,
      email,
      primaryColor,
      _hp_check,
    } = body;

    // Honeypot anti-bots
    if (_hp_check) {
      return NextResponse.json({ success: true, redirectUrl: '/store/demo' });
    }

    // Validaciones
    if (!companyName || !slug || !whatsapp || !industryType) {
      return NextResponse.json(
        { error: 'Empresa, subdominio, WhatsApp e industria son requeridos.' },
        { status: 400 }
      );
    }

    // Sanitizar slug (solo letras, números y guiones)
    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '');

    if (cleanSlug.length < 3 || cleanSlug.length > 30) {
      return NextResponse.json(
        { error: 'El subdominio debe tener entre 3 y 30 caracteres alfanuméricos.' },
        { status: 400 }
      );
    }

    // Nombres reservados
    const reservedSlugs = ['admin', 'api', 'store', 'www', 'app', 'platform', 'registro', 'login', 'dashboard', 'tenddy'];
    if (reservedSlugs.includes(cleanSlug)) {
      return NextResponse.json(
        { error: 'Este subdominio es un término reservado por la plataforma. Elige otro.' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    // 1. Verificar disponibilidad del slug
    const { data: existingTenant } = await admin
      .from('tenants')
      .select('id')
      .eq('slug', cleanSlug)
      .single();

    if (existingTenant) {
      return NextResponse.json(
        { error: `El subdominio "${cleanSlug}.tenddy.shop" ya está en uso. Elige uno diferente.` },
        { status: 409 }
      );
    }

    // 2. Definir theming y copys según la industria
    const color = primaryColor || (industryType === 'confectionery' ? '#e11d48' : '#0284c7');
    const heroTitle = `Catálogo Mayorista de ${companyName}`;
    const heroSubtitle = `Fabricación y distribución B2B directa con entregas a nivel nacional e internacional.`;

    // 3. Crear Tenant en Supabase
    const { data: tenant, error: tenantError } = await admin
      .from('tenants')
      .insert({
        slug: cleanSlug,
        name: companyName.trim(),
        industry_type: industryType,
        logo_url: null,
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
          whatsapp_default: whatsapp.replace(/[^0-9]/g, ''),
          display_phone: whatsapp,
          email: email || null,
          address: address || `${city || 'Ciudad Central'}`,
          hours: 'Lunes a Viernes: 8:00 AM - 5:30 PM',
          plant_location: city || 'Planta Principal',
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
      name: `Sede Principal ${city ? `- ${city}` : ''}`,
      branch_type: 'plant',
      city: city || 'Sede Central',
      address: address || 'Dirección de Despacho Principal',
      phone_whatsapp: whatsapp.replace(/[^0-9]/g, ''),
      email: email || null,
      is_main_branch: true,
      is_active: true,
    });

    // 6. Crear Categorías Iniciales Base
    const defaultCategories = industryType === 'plastics'
      ? [
          { slug: 'botellas', name: 'Botellas & Envases' },
          { slug: 'tapas', name: 'Tapas & Accesorios' },
        ]
      : industryType === 'confectionery'
      ? [
          { slug: 'dulces', name: 'Caramelos & Golosinas' },
          { slug: 'chocolates', name: 'Chocolates & Coberturas' },
        ]
      : [
          { slug: 'linea-estandar', name: 'Línea Estándar' },
          { slug: 'linea-especial', name: 'Línea Especial / Mayorista' },
        ];

    await admin.from('categories').insert(
      defaultCategories.map((c, i) => ({
        tenant_id: tenant.id,
        slug: c.slug,
        name: c.name,
        sort_order: i,
        is_active: true,
      }))
    );

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
