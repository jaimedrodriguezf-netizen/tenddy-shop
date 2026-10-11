import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Detección de IP y Rate Limiting anti-bots
    // Límite: máximo 5 solicitudes de cotización por minuto por IP
    const clientIp = getClientIp(request);
    const { isAllowed } = checkRateLimit(`quote_${clientIp}`, {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 5,
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes en poco tiempo. Por favor espera un momento.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      tenant_id,
      branch_id,
      customer_name,
      company_name,
      tax_id,
      customer_phone,
      customer_email,
      delivery_city,
      delivery_address,
      notes,
      items,
      // Campo honeypot anti-spam (invisible para humanos, llenado por bots)
      _hp_check,
      // Campo timestamp para detectar envíos automáticos sobrehumanos (< 1.5 seg)
      _form_rendered_at,
    } = body;

    // 2. Trampa Honeypot: si el campo oculto tiene valor, es un bot 100% garantizado
    if (_hp_check) {
      // Respondemos OK ficticio para no alertar al bot, pero no guardamos nada en base de datos
      return NextResponse.json({ success: true, quote: { quote_number: 'COT-BOT-DETECTED' } });
    }

    // 3. Trampa de velocidad (Time-trap): un humano tarda al menos 3 a 5 segundos en llenar el formulario
    if (_form_rendered_at && typeof _form_rendered_at === 'number') {
      const timeElapsedMs = Date.now() - _form_rendered_at;
      if (timeElapsedMs < 1500) {
        // Envió en menos de 1.5 segundos -> descartado por automatización sobrehumana
        return NextResponse.json({ success: true, quote: { quote_number: 'COT-FAST-DISMISSED' } });
      }
    }

    // 4. Validación estricta de estructura
    if (!tenant_id || !customer_name || !customer_phone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios para registrar la cotización' },
        { status: 400 }
      );
    }

    // 5. Sanitización de longitudes (neutraliza payloads masivos)
    if (customer_name.length > 120 || customer_phone.length > 30) {
      return NextResponse.json({ error: 'Longitud de campos de contacto excedida' }, { status: 400 });
    }
    if (company_name && company_name.length > 150) {
      return NextResponse.json({ error: 'Razón social excede el límite permitido' }, { status: 400 });
    }
    if (notes && notes.length > 1000) {
      return NextResponse.json({ error: 'Notas exceden el límite de 1000 caracteres' }, { status: 400 });
    }
    if (items.length > 50) {
      return NextResponse.json({ error: 'Máximo 50 referencias por cotización' }, { status: 400 });
    }

    // 6. Sanitización y validación defensiva de cada item de la cotización
    const sanitizedItems = items.map((item: any) => ({
      product_id: typeof item.product_id === 'string' ? item.product_id.trim() : undefined,
      name: String(item.name || 'Producto').slice(0, 120).trim(),
      sku: String(item.sku || '').slice(0, 50).trim(),
      package_count: Math.max(1, Math.min(100000, Number(item.package_count) || 1)),
      units_per_package: Math.max(1, Math.min(100000, Number(item.units_per_package) || 1)),
      total_units: Math.max(1, Math.min(10000000, Number(item.total_units) || 1)),
      selected_color: typeof item.selected_color === 'string' ? item.selected_color.slice(0, 40).trim() : undefined,
      specs: typeof item.specs === 'object' && item.specs !== null ? item.specs : {},
    }));

    const admin = getAdminClient();

    // 7. Validación multi-tenant estricta: asegurar que los productos pertenezcan exclusivamente a este tenant
    const productIdsToCheck = sanitizedItems
      .map((it: any) => it.product_id)
      .filter((id: any) => typeof id === 'string' && id.length > 10);

    if (productIdsToCheck.length > 0) {
      const { data: dbProducts } = await admin
        .from('products')
        .select('id, tenant_id')
        .in('id', productIdsToCheck)
        .eq('tenant_id', tenant_id);

      const validIds = new Set((dbProducts || []).map((p) => p.id));
      const hasForeignProducts = productIdsToCheck.some((pid: string) => !validIds.has(pid));

      if (hasForeignProducts) {
        return NextResponse.json(
          { error: 'La cotización contiene productos que no pertenecen al catálogo de esta tienda.' },
          { status: 400 }
        );
      }
    }

    // Generar consecutivo amigable (e.g. COT-2026-XXXX)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const quote_number = `COT-${new Date().getFullYear()}-${randomSuffix}`;

    const { data: quote, error } = await admin
      .from('quotes')
      .insert({
        tenant_id,
        branch_id: branch_id || null,
        quote_number,
        customer_name: customer_name.trim(),
        company_name: company_name ? company_name.trim() : null,
        tax_id: tax_id ? tax_id.trim() : null,
        customer_phone: customer_phone.trim(),
        customer_email: customer_email ? customer_email.trim().toLowerCase() : null,
        delivery_city: delivery_city ? delivery_city.trim() : null,
        delivery_address: delivery_address ? delivery_address.trim() : null,
        notes: notes ? notes.trim() : null,
        items: sanitizedItems,
        status: 'pending',
      })
      .select('id, quote_number, created_at')
      .single();

    if (error) {
      console.error('Error insertando cotización en Supabase:', error);
      return NextResponse.json({ error: 'Error procesando la solicitud' }, { status: 500 });
    }

    return NextResponse.json({ success: true, quote });
  } catch (err: any) {
    console.error('Excepción en /api/quotes:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
