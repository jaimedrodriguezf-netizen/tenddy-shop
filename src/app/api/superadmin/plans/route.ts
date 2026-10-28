import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';
import { verifySuperadminToken } from '@/lib/session';
import { DEFAULT_PLANS, validatePlanPayload } from '@/lib/plans';
import { Plan } from '@/lib/types';

async function checkSuperadminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tenddy_superadmin_session');
  return verifySuperadminToken(sessionCookie?.value);
}

// 1. Listar todos los planes para la Torre de Control Superadmin
export async function GET() {
  try {
    if (!(await checkSuperadminAuth())) {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const admin = getAdminClient();

    // Consultar planes y distribución de tenants en paralelo de forma defensiva
    const [plansRes, tenantsRes] = await Promise.all([
      admin.from('plans').select('*').order('sort_order', { ascending: true }),
      admin.from('tenants').select('id, plan_slug'),
    ]);

    // Contar tenants por plan
    const tenantCountByPlan: Record<string, number> = {};
    if (tenantsRes.data && Array.isArray(tenantsRes.data)) {
      tenantsRes.data.forEach((t: any) => {
        const slug = t.plan_slug || 'starter';
        tenantCountByPlan[slug] = (tenantCountByPlan[slug] || 0) + 1;
      });
    }

    // Si la tabla no existe o dio error de DDL pendiente, devolvemos el catálogo predeterminado
    let plans: Plan[] = [];
    if (plansRes.error || !plansRes.data || plansRes.data.length === 0) {
      plans = DEFAULT_PLANS;
    } else {
      plans = plansRes.data.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description || '',
        price_monthly: Number(p.price_monthly) || 0,
        price_yearly: Number(p.price_yearly) || 0,
        currency: p.currency || 'USD',
        badge: p.badge || '',
        sort_order: Number(p.sort_order) || 0,
        is_active: Boolean(p.is_active),
        is_public: Boolean(p.is_public),
        features: Array.isArray(p.features) ? p.features : [],
        limits: typeof p.limits === 'object' && p.limits !== null ? p.limits : DEFAULT_PLANS[0].limits,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));
    }

    return NextResponse.json({
      success: true,
      plans,
      tenantCountByPlan,
      totalTenants: tenantsRes.data?.length || 0,
    });
  } catch (err: unknown) {
    console.error('Excepción en GET /api/superadmin/plans:', err);
    return NextResponse.json({
      success: true,
      plans: DEFAULT_PLANS,
      tenantCountByPlan: {},
      totalTenants: 0,
      fallback: true,
    });
  }
}

// 2. Crear un nuevo plan comercial
export async function POST(request: Request) {
  try {
    if (!(await checkSuperadminAuth())) {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const body = await request.json();
    const validation = validatePlanPayload(body);

    if (!validation.valid || !validation.plan) {
      return NextResponse.json({ error: validation.error || 'Datos del plan inválidos' }, { status: 400 });
    }

    const admin = getAdminClient();

    // Verificar unicidad de slug
    const { data: existing } = await admin
      .from('plans')
      .select('id')
      .eq('slug', validation.plan.slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: `Ya existe un plan con el identificador "${validation.plan.slug}"` }, { status: 409 });
    }

    const { data: created, error } = await admin
      .from('plans')
      .insert({
        ...validation.plan,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error insertando plan en BD:', error);
      return NextResponse.json({ error: 'No se pudo guardar el nuevo plan en la base de datos' }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan: created });
  } catch (err: unknown) {
    console.error('Excepción en POST /api/superadmin/plans:', err);
    return NextResponse.json({ error: 'Error interno del servidor al crear el plan' }, { status: 500 });
  }
}

// 3. Modificar un plan existente
export async function PATCH(request: Request) {
  try {
    if (!(await checkSuperadminAuth())) {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const body = await request.json();
    const { id, slug, ...updates } = body;

    if (!id && !slug) {
      return NextResponse.json({ error: 'Se requiere el id o slug del plan a actualizar' }, { status: 400 });
    }

    const validation = validatePlanPayload({ ...updates, slug: slug || 'temp_slug' });
    if (!validation.valid || !validation.plan) {
      return NextResponse.json({ error: validation.error || 'Datos de actualización inválidos' }, { status: 400 });
    }

    const admin = getAdminClient();
    const updateData: Record<string, any> = {
      name: validation.plan.name,
      description: validation.plan.description,
      price_monthly: validation.plan.price_monthly,
      price_yearly: validation.plan.price_yearly,
      currency: validation.plan.currency,
      badge: validation.plan.badge,
      sort_order: validation.plan.sort_order,
      is_active: validation.plan.is_active,
      is_public: validation.plan.is_public,
      features: validation.plan.features,
      limits: validation.plan.limits,
      updated_at: new Date().toISOString(),
    };

    let query = admin.from('plans').update(updateData);
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', slug);
    }

    const { data: updated, error } = await query.select('*').single();

    if (error) {
      console.error('Error actualizando plan en BD:', error);
      return NextResponse.json({ error: 'No se pudo actualizar el plan en la base de datos' }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan: updated });
  } catch (err: unknown) {
    console.error('Excepción en PATCH /api/superadmin/plans:', err);
    return NextResponse.json({ error: 'Error interno del servidor al actualizar el plan' }, { status: 500 });
  }
}

// 4. Desactivar / Archivar un plan (Soft delete de seguridad)
export async function DELETE(request: Request) {
  try {
    if (!(await checkSuperadminAuth())) {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    if (!slug && !id) {
      return NextResponse.json({ error: 'Falta slug o id del plan' }, { status: 400 });
    }

    if (slug === 'starter') {
      return NextResponse.json({ error: 'El plan base Starter no puede ser eliminado por ser el fallback del sistema' }, { status: 400 });
    }

    const admin = getAdminClient();

    // En lugar de borrar destructivamente (que rompería integridad de suscripciones pasadas),
    // se desactiva y oculta del catálogo
    let query = admin.from('plans').update({
      is_active: false,
      is_public: false,
      updated_at: new Date().toISOString(),
    });

    if (id) {
      query = query.eq('id', id);
    } else if (slug) {
      query = query.eq('slug', slug);
    }

    const { error } = await query;
    if (error) {
      console.error('Error desactivando plan:', error);
      return NextResponse.json({ error: 'No se pudo desactivar el plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Plan desactivado correctamente' });
  } catch (err: unknown) {
    console.error('Excepción en DELETE /api/superadmin/plans:', err);
    return NextResponse.json({ error: 'Error interno al desactivar el plan' }, { status: 500 });
  }
}
