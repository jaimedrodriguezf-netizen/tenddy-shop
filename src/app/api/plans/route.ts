import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { DEFAULT_PLANS } from '@/lib/plans';
import { Plan } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache 60s para landings públicas

// Endpoint público para listar planes comerciales activos de Tenddy
export async function GET() {
  try {
    const admin = getAdminClient();
    const { data: dbPlans, error } = await admin
      .from('plans')
      .select('id, slug, name, description, price_monthly, price_yearly, currency, badge, sort_order, features, limits')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('sort_order', { ascending: true });

    if (error || !dbPlans || dbPlans.length === 0) {
      // Fallback defensivo: catálogo de planes base
      return NextResponse.json({
        success: true,
        plans: DEFAULT_PLANS.filter((p) => p.is_active && p.is_public),
        source: 'default_catalog',
      });
    }

    const plans: Plan[] = dbPlans.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description || '',
      price_monthly: Number(p.price_monthly) || 0,
      price_yearly: Number(p.price_yearly) || 0,
      currency: p.currency || 'USD',
      badge: p.badge || '',
      sort_order: Number(p.sort_order) || 0,
      is_active: true,
      is_public: true,
      features: Array.isArray(p.features) ? p.features : [],
      limits: typeof p.limits === 'object' && p.limits !== null ? p.limits : DEFAULT_PLANS[0].limits,
    }));

    return NextResponse.json({
      success: true,
      plans,
      source: 'database',
    });
  } catch (err: unknown) {
    console.error('Error en GET /api/plans:', err);
    return NextResponse.json({
      success: true,
      plans: DEFAULT_PLANS.filter((p) => p.is_active && p.is_public),
      source: 'default_fallback',
    });
  }
}
