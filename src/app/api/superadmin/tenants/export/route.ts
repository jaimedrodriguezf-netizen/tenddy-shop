import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';
import { verifySuperadminToken } from '@/lib/session';

/**
 * Convierte un valor de JavaScript a una representación SQL segura para Postgres.
 */
function toSqlValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') {
    if (isNaN(val)) return 'NULL';
    return String(val);
  }
  if (typeof val === 'object') {
    // Array o JSON object
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }
  // String genérico: escapar comillas simples
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

/**
 * Genera una sentencia INSERT INTO segura a partir de un arreglo de objetos.
 */
function buildSqlInserts(tableName: string, rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return `-- No hay registros en ${tableName}\n`;

  const columns = Object.keys(rows[0]);
  const lines: string[] = [];

  lines.push(`-- Tabla: ${tableName} (${rows.length} registros)`);
  lines.push(`INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES`);

  const valuesClauses = rows.map((row) => {
    const rowValues = columns.map((col) => toSqlValue(row[col]));
    return `  (${rowValues.join(', ')})`;
  });

  lines.push(valuesClauses.join(',\n') + ';');
  lines.push('');
  return lines.join('\n');
}

/**
 * Ensambla el Dump SQL completo y portable para inicializar un Supabase o Postgres dedicado.
 */
function generateTenantSqlDump(data: {
  tenant: Record<string, any>;
  domains: Record<string, any>[];
  branches: Record<string, any>[];
  categories: Record<string, any>[];
  products: Record<string, any>[];
  b2bCustomers: Record<string, any>[];
  quotes: Record<string, any>[];
}): string {
  const timestamp = new Date().toISOString();
  const tenantSlug = data.tenant.slug || 'unknown';
  const tenantName = data.tenant.name || 'Tenant';

  let sql = `-- ==============================================================================
-- TENDDY SHOP - DUMP DE INSTANCIA DEDICADA / DESACOPLE
-- Tenant: ${tenantName} (Slug: ${tenantSlug})
-- Fecha de Generación: ${timestamp}
-- Motor Destino: PostgreSQL / Supabase Dedicated Project
-- ==============================================================================

BEGIN;

-- 1. Tenant Principal
${buildSqlInserts('tenants', [data.tenant])}

-- 2. Dominios Personalizados
${buildSqlInserts('tenant_domains', data.domains)}

-- 3. Sucursales y Plantas Físicas
${buildSqlInserts('branches', data.branches)}

-- 4. Categorías de Productos
${buildSqlInserts('categories', data.categories)}

-- 5. Catálogo de Productos y Fichas Técnicas
${buildSqlInserts('products', data.products)}

-- 6. Clientes B2B y Cuentas Corporativas
${buildSqlInserts('b2b_tenant_customers', data.b2bCustomers)}

-- 7. Historial de Cotizaciones
${buildSqlInserts('quotes', data.quotes)}

COMMIT;

-- Fin del Dump de Desacople para ${tenantSlug}
`;

  return sql;
}

async function handleExport(tenantId: string, format: string) {
  const admin = getAdminClient();

  // 1. Obtener Tenant principal
  const { data: tenant, error: tErr } = await admin
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (tErr || !tenant) {
    return NextResponse.json({ error: 'Tenant no encontrado o inaccesible' }, { status: 404 });
  }

  // 2. Extraer entidades relacionadas en paralelo
  const [
    { data: domains },
    { data: branches },
    { data: categories },
    { data: products },
    { data: b2bCustomers },
    { data: quotes },
  ] = await Promise.all([
    admin.from('tenant_domains').select('*').eq('tenant_id', tenantId),
    admin.from('branches').select('*').eq('tenant_id', tenantId),
    admin.from('categories').select('*').eq('tenant_id', tenantId),
    admin.from('products').select('*').eq('tenant_id', tenantId),
    admin.from('b2b_tenant_customers').select('*').eq('tenant_id', tenantId),
    admin.from('quotes').select('*').eq('tenant_id', tenantId),
  ]);

  const exportPayload = {
    tenant,
    domains: domains || [],
    branches: branches || [],
    categories: categories || [],
    products: products || [],
    b2bCustomers: b2bCustomers || [],
    quotes: quotes || [],
    exported_at: new Date().toISOString(),
    version: '1.0.0',
  };

  const filename = `${tenant.slug}-dedicated-dump-${new Date().toISOString().split('T')[0]}`;

  if (format === 'json') {
    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    });
  }

  // Por defecto: formato SQL
  const sqlDump = generateTenantSqlDump(exportPayload);
  return new NextResponse(sqlDump, {
    status: 200,
    headers: {
      'Content-Type': 'application/sql; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.sql"`,
    },
  });
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenddy_superadmin_session');

    if (!verifySuperadminToken(sessionCookie?.value)) {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const format = (searchParams.get('format') || 'sql').toLowerCase();

    if (!tenantId) {
      return NextResponse.json({ error: 'Falta parámetro tenant_id' }, { status: 400 });
    }

    return await handleExport(tenantId, format);
  } catch (err: unknown) {
    console.error('Error procesando exportación de tenant en superadmin:', err);
    return NextResponse.json({ error: 'Error interno al exportar datos del tenant' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenddy_superadmin_session');

    if (!verifySuperadminToken(sessionCookie?.value)) {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const body = await request.json();
    const tenantId = body?.tenant_id;
    const format = (body?.format || 'sql').toLowerCase();

    if (!tenantId) {
      return NextResponse.json({ error: 'Falta campo tenant_id' }, { status: 400 });
    }

    return await handleExport(tenantId, format);
  } catch (err: unknown) {
    console.error('Error procesando POST exportación de tenant:', err);
    return NextResponse.json({ error: 'Error interno al exportar datos del tenant' }, { status: 500 });
  }
}
