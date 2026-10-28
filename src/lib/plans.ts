import { Plan, PlanLimits, BillingCycle } from './types';

// ==========================================================
// TENDDY SAAS: Planes por Defecto (Fallback anti-desfase DDL)
// Permite que la app funcione idéntica aún si la migración 0019
// todavía no se ejecutó en una instancia dedicada o de staging.
// ==========================================================

export const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan_free',
    slug: 'free',
    name: 'Plan Gratuito',
    description: 'Para probar la plataforma y comenzar a recibir pedidos por WhatsApp sin costo.',
    price_monthly: 0.00,
    price_yearly: 0.00,
    currency: 'USD',
    badge: 'Gratis',
    sort_order: 1,
    is_active: true,
    is_public: true,
    features: [
      'Catálogo digital móvil y web optimizado',
      'Hasta 10 productos con 2 fotos cada uno',
      'Botón directo de cotización a WhatsApp',
      '1 Sucursal o taller matriz',
      '1 Usuario administrador',
      'Subdominio tenddy.shop incluido',
      '100% Gratis sin tarjeta de crédito',
    ],
    limits: {
      max_products: 10,
      max_images_per_product: 2,
      max_branches: 1,
      max_team_members: 1,
      custom_domain_allowed: false,
      custom_landing_allowed: false,
      bulk_import_allowed: false,
      support_priority: 'standard',
      max_storage_mb: 50,
      analytics_enabled: false,
      remove_branding: false,
    },
  },
  {
    id: 'plan_essential',
    slug: 'essential',
    name: 'Catálogo Esencial',
    description: 'Para pequeños talleres y distribuidores que buscan digitalizar su catálogo con 500 productos y pago anual ultra accesible.',
    price_monthly: 10.00,
    price_yearly: 100.00,
    currency: 'USD',
    badge: 'Económico',
    sort_order: 2,
    is_active: true,
    is_public: true,
    features: [
      'Catálogo digital móvil y web optimizado',
      'Hasta 500 productos con 1 foto principal',
      'Botón directo de cotización a WhatsApp',
      '1 Sucursal o taller matriz',
      '1 Usuario administrador',
      'Subdominio tenddy.shop incluido',
      'Soporte estándar vía Mesa de Ayuda',
      'Tarifa anual preferencial de $100 USD/año',
    ],
    limits: {
      max_products: 500,
      max_images_per_product: 1,
      max_branches: 1,
      max_team_members: 1,
      custom_domain_allowed: false,
      custom_landing_allowed: false,
      bulk_import_allowed: false,
      support_priority: 'standard',
      max_storage_mb: 500,
      analytics_enabled: false,
      remove_branding: false,
    },
  },
  {
    id: 'plan_starter',
    slug: 'starter',
    name: 'Catálogo Starter',
    description: 'Ideal para fábricas y distribuidores en crecimiento con catálogo mediano y fotos detalladas.',
    price_monthly: 29.00,
    price_yearly: 290.00,
    currency: 'USD',
    badge: 'Crecimiento',
    sort_order: 3,
    is_active: true,
    is_public: true,
    features: [
      'Catálogo digital responsivo móvil y desktop',
      'Hasta 350 productos con 3 fotos cada uno',
      'Cotizaciones directas a WhatsApp por sucursal',
      '1 Sucursal o Planta matriz',
      'Hasta 2 miembros de equipo comercial',
      'Subdominio tenddy.shop incluido',
      'Soporte estándar vía Mesa de Ayuda',
    ],
    limits: {
      max_products: 350,
      max_images_per_product: 3,
      max_branches: 1,
      max_team_members: 2,
      custom_domain_allowed: false,
      custom_landing_allowed: false,
      bulk_import_allowed: false,
      support_priority: 'standard',
      max_storage_mb: 800,
      analytics_enabled: false,
      remove_branding: false,
    },
  },
  {
    id: 'plan_pro',
    slug: 'pro',
    name: 'E-Commerce B2B Pro',
    description: 'Para empresas consolidadas que requieren importación masiva, landing corporativa y cotizaciones avanzadas.',
    price_monthly: 69.00,
    price_yearly: 690.00,
    currency: 'USD',
    badge: 'Más Popular',
    sort_order: 4,
    is_active: true,
    is_public: true,
    features: [
      'Todo lo incluido en Starter',
      'Hasta 1000 productos con hasta 6 fotos + video',
      'Importación y exportación masiva en Excel oficial',
      'Landing corporativa modular personalizable',
      'Hasta 3 sucursales o centros de distribución',
      'Hasta 5 usuarios administradores y vendedores',
      'Portal de clientes B2B con precios por volumen',
      'Soporte prioritario con SLA de 24h',
    ],
    limits: {
      max_products: 1000,
      max_images_per_product: 6,
      max_branches: 3,
      max_team_members: 5,
      custom_domain_allowed: false,
      custom_landing_allowed: true,
      bulk_import_allowed: true,
      support_priority: 'priority',
      max_storage_mb: 3000,
      analytics_enabled: true,
      remove_branding: false,
    },
  },
  {
    id: 'plan_enterprise',
    slug: 'enterprise',
    name: 'Corporativo Industrial',
    description: 'Para fabricantes y grandes plantas industriales con alta demanda, dominio propio y soporte 24/7.',
    price_monthly: 179.00,
    price_yearly: 1790.00,
    currency: 'USD',
    badge: 'Industrial',
    sort_order: 5,
    is_active: true,
    is_public: true,
    features: [
      'Todo lo incluido en Pro',
      'Catálogo y productos ilimitados',
      'Plantas, sucursales y bodegas ilimitadas',
      'Dominio propio personalizado (ej: miempresa.com)',
      'Sin marca de agua de Tenddy',
      'Telemetría de planta en vivo y video corporativo',
      'Usuarios de equipo ilimitados con roles B2B',
      'Soporte VIP dedicado con atención por WhatsApp 24/7',
    ],
    limits: {
      max_products: -1,
      max_images_per_product: -1,
      max_branches: -1,
      max_team_members: -1,
      custom_domain_allowed: true,
      custom_landing_allowed: true,
      bulk_import_allowed: true,
      support_priority: 'dedicated_24_7',
      max_storage_mb: 10000,
      analytics_enabled: true,
      remove_branding: true,
    },
  },
];

export const DEFAULT_PLAN_SLUG = 'starter';

/**
 * Obtiene un plan por slug buscando en una lista opcional o recurriendo al catálogo por defecto.
 */
export function getPlanBySlug(slug?: string | null, customPlans?: Plan[]): Plan {
  const target = (slug || DEFAULT_PLAN_SLUG).toLowerCase().trim();
  const list = Array.isArray(customPlans) && customPlans.length > 0 ? customPlans : DEFAULT_PLANS;
  
  const found = list.find((p) => p.slug.toLowerCase() === target);
  if (found) return found;

  const fallback = DEFAULT_PLANS.find((p) => p.slug === DEFAULT_PLAN_SLUG);
  return fallback || DEFAULT_PLANS[0];
}

/**
 * Verifica un límite numérico o booleano de un plan contra una métrica de uso.
 */
export function checkPlanLimit(
  plan: Plan,
  limitKey: keyof PlanLimits,
  currentCount = 0
): {
  allowed: boolean;
  max: number | boolean;
  current: number;
  isUnlimited: boolean;
} {
  const limitValue = plan.limits[limitKey];

  if (typeof limitValue === 'boolean') {
    return {
      allowed: limitValue,
      max: limitValue,
      current: currentCount,
      isUnlimited: false,
    };
  }

  if (typeof limitValue === 'number') {
    const isUnlimited = limitValue === -1;
    const allowed = isUnlimited || currentCount < limitValue;
    return {
      allowed,
      max: limitValue,
      current: currentCount,
      isUnlimited,
    };
  }

  return {
    allowed: true,
    max: -1,
    current: currentCount,
    isUnlimited: true,
  };
}

/**
 * Formatea un monto con símbolo de moneda USD
 */
export function formatPlanPrice(amount: number, currency = 'USD'): string {
  if (amount === 0) return 'Gratis';
  return `$${amount.toFixed(2)} ${currency}`;
}

/**
 * Calcula el ahorro en porcentaje o en dólares al pagar anualmente
 */
export function calculateAnnualSavings(priceMonthly: number, priceYearly: number): { percent: number; savedAmount: number } {
  const annualAtMonthlyRate = priceMonthly * 12;
  if (annualAtMonthlyRate <= 0 || priceYearly <= 0) return { percent: 0, savedAmount: 0 };
  
  const savedAmount = Math.max(0, annualAtMonthlyRate - priceYearly);
  const percent = Math.round((savedAmount / annualAtMonthlyRate) * 100);
  return { percent, savedAmount };
}

/**
 * Valida y sanitiza el payload para crear o actualizar un plan
 */
export function validatePlanPayload(body: any): { valid: boolean; error?: string; plan?: Partial<Plan> } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'El cuerpo de la solicitud es inválido' };
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 128) : '';
  if (!name) {
    return { valid: false, error: 'El nombre comercial del plan es requerido' };
  }

  const slug = typeof body.slug === 'string' ? body.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '').slice(0, 64) : '';
  if (!slug) {
    return { valid: false, error: 'El slug identificador del plan es requerido (solo letras, números y guiones)' };
  }

  const priceMonthly = Number(body.price_monthly);
  if (isNaN(priceMonthly) || priceMonthly < 0) {
    return { valid: false, error: 'El precio mensual debe ser un número mayor o igual a 0' };
  }

  const priceYearly = Number(body.price_yearly);
  if (isNaN(priceYearly) || priceYearly < 0) {
    return { valid: false, error: 'El precio anual debe ser un número mayor o igual a 0' };
  }

  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '';
  const badge = typeof body.badge === 'string' ? body.badge.trim().slice(0, 64) : '';
  const currency = typeof body.currency === 'string' && body.currency.trim() ? body.currency.trim().toUpperCase().slice(0, 10) : 'USD';
  const sortOrder = typeof body.sort_order === 'number' ? body.sort_order : 0;
  const isActive = body.is_active !== undefined ? Boolean(body.is_active) : true;
  const isPublic = body.is_public !== undefined ? Boolean(body.is_public) : true;

  // Sanitizar lista de características (features)
  const rawFeatures = Array.isArray(body.features) ? body.features : [];
  const features = rawFeatures
    .filter((f: any) => typeof f === 'string' && f.trim().length > 0)
    .map((f: string) => f.trim().slice(0, 200));

  // Sanitizar límites
  const rawLimits = typeof body.limits === 'object' && body.limits !== null ? body.limits : {};
  const limits: PlanLimits = {
    max_products: typeof rawLimits.max_products === 'number' ? rawLimits.max_products : 50,
    max_images_per_product: typeof rawLimits.max_images_per_product === 'number' ? rawLimits.max_images_per_product : 2,
    max_branches: typeof rawLimits.max_branches === 'number' ? rawLimits.max_branches : 1,
    max_team_members: typeof rawLimits.max_team_members === 'number' ? rawLimits.max_team_members : 2,
    custom_domain_allowed: Boolean(rawLimits.custom_domain_allowed),
    custom_landing_allowed: Boolean(rawLimits.custom_landing_allowed),
    bulk_import_allowed: Boolean(rawLimits.bulk_import_allowed),
    support_priority: ['standard', 'priority', 'dedicated_24_7'].includes(rawLimits.support_priority)
      ? rawLimits.support_priority
      : 'standard',
    max_storage_mb: typeof rawLimits.max_storage_mb === 'number' ? rawLimits.max_storage_mb : 250,
    analytics_enabled: Boolean(rawLimits.analytics_enabled),
    remove_branding: Boolean(rawLimits.remove_branding),
  };

  return {
    valid: true,
    plan: {
      slug,
      name,
      description,
      price_monthly: priceMonthly,
      price_yearly: priceYearly,
      currency,
      badge,
      sort_order: sortOrder,
      is_active: isActive,
      is_public: isPublic,
      features,
      limits,
    },
  };
}
