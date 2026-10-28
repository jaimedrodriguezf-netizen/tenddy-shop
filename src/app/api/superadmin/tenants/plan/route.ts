import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase';
import { verifySuperadminToken } from '@/lib/session';
import { getPlanBySlug } from '@/lib/plans';

async function checkSuperadminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tenddy_superadmin_session');
  return verifySuperadminToken(sessionCookie?.value);
}

// Asignar o cambiar de plan comercial a una empresa/tenant
export async function PATCH(request: Request) {
  try {
    if (!(await checkSuperadminAuth())) {
      return NextResponse.json({ error: 'No autorizado como Superadmin' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, plan_slug, billing_cycle = 'monthly', status = 'active', notes = '' } = body;

    if (!tenant_id || !plan_slug) {
      return NextResponse.json({ error: 'Faltan parámetros: tenant_id y plan_slug son requeridos' }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1. Obtener datos del plan seleccionado
    const { data: dbPlan } = await admin
      .from('plans')
      .select('*')
      .eq('slug', plan_slug)
      .maybeSingle();

    const plan = dbPlan || getPlanBySlug(plan_slug);

    // 2. Actualizar tenant con el nuevo plan
    // También gobernamos si el plan habilita custom_landing_unlocked
    const { data: currentTenant } = await admin
      .from('tenants')
      .select('theme_config')
      .eq('id', tenant_id)
      .single();

    const currentTheme = currentTenant?.theme_config || {};
    const shouldUnlockLanding = plan.limits?.custom_landing_allowed === true;

    const updatedTheme = {
      ...currentTheme,
      ...(shouldUnlockLanding ? { custom_landing_unlocked: true } : {}),
    };

    const updatePayload: Record<string, any> = {
      plan_slug: plan.slug,
      plan_status: status,
      theme_config: updatedTheme,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedTenant, error: tenantErr } = await admin
      .from('tenants')
      .update(updatePayload)
      .eq('id', tenant_id)
      .select('id, slug, name, plan_slug, plan_status, theme_config')
      .single();

    if (tenantErr) {
      console.error('Error actualizando plan en tenant:', tenantErr);
      return NextResponse.json({ error: 'No se pudo actualizar el plan de la empresa' }, { status: 500 });
    }

    // 3. Registrar registro histórico en tenant_subscriptions (defensivo)
    try {
      const pricePaid = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
      const periodEnd = new Date();
      if (billing_cycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await admin.from('tenant_subscriptions').insert({
        tenant_id,
        plan_id: dbPlan?.id || null,
        plan_slug: plan.slug,
        status,
        billing_cycle,
        price_paid: pricePaid,
        currency: plan.currency || 'USD',
        started_at: new Date().toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        notes: notes ? notes.trim() : `Asignado por Superadmin a plan ${plan.name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (subErr) {
      // Si la tabla tenant_subscriptions aún no existe en BD, no bloqueamos la actualización del tenant
      console.warn('Nota: No se pudo registrar en tenant_subscriptions (posible migración pendiente):', subErr);
    }

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
      plan,
      message: `Plan ${plan.name} asignado exitosamente`,
    });
  } catch (err: unknown) {
    console.error('Excepción en PATCH /api/superadmin/tenants/plan:', err);
    return NextResponse.json({ error: 'Error interno del servidor al asignar plan' }, { status: 500 });
  }
}
