import { Plan, PlanLimits, BillingCycle } from './types';
import { buildEcuadorWhatsAppUrl } from './ecuador-phone';

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
    id: 'plan_100',
    slug: 'plan_100',
    name: 'Catálogo 100',
    description: 'Para talleres y pequeños comercios que inician su catálogo digital con tarifa anual súper accesible.',
    price_monthly: 5.00,
    price_yearly: 50.00,
    currency: 'USD',
    badge: 'Económico',
    sort_order: 2,
    is_active: true,
    is_public: true,
    features: [
      'Catálogo digital móvil y web optimizado',
      'Hasta 100 productos con 1 foto principal',
      'Botón directo de cotización a WhatsApp',
      '1 Sucursal o taller matriz',
      '1 Usuario administrador',
      'Subdominio tenddy.shop incluido',
      'Soporte estándar vía Mesa de Ayuda',
      'Tarifa anual fija de $50 USD/año',
    ],
    limits: {
      max_products: 100,
      max_images_per_product: 1,
      max_branches: 1,
      max_team_members: 1,
      custom_domain_allowed: false,
      custom_landing_allowed: false,
      bulk_import_allowed: false,
      support_priority: 'standard',
      max_storage_mb: 200,
      analytics_enabled: false,
      remove_branding: false,
    },
  },
  {
    id: 'plan_500',
    slug: 'plan_500',
    name: 'Catálogo 500',
    description: 'Ideal para talleres y distribuidores que buscan digitalizar su catálogo completo de hasta 500 productos.',
    price_monthly: 10.00,
    price_yearly: 100.00,
    currency: 'USD',
    badge: 'Más Popular',
    sort_order: 3,
    is_active: true,
    is_public: true,
    features: [
      'Catálogo digital móvil y web optimizado',
      'Hasta 500 productos con 1 foto principal',
      'Botón directo de cotización a WhatsApp',
      '1 Sucursal o planta matriz',
      '1 Usuario administrador',
      'Subdominio tenddy.shop incluido',
      'Soporte estándar vía Mesa de Ayuda',
      'Tarifa anual fija de $100 USD/año',
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
    id: 'plan_1000',
    slug: 'plan_1000',
    name: 'Catálogo 1.000',
    description: 'Para empresas con catálogos amplios que requieren importación masiva en Excel oficial.',
    price_monthly: 25.00,
    price_yearly: 250.00,
    currency: 'USD',
    badge: 'Crecimiento',
    sort_order: 4,
    is_active: true,
    is_public: true,
    features: [
      'Todo lo incluido en el Plan 500',
      'Hasta 1.000 productos con 2 fotos cada uno',
      'Importación y exportación masiva oficial en Excel (.xlsx)',
      'Hasta 2 sucursales o plantas',
      'Hasta 3 usuarios de equipo comercial',
      'Soporte estándar vía Mesa de Ayuda',
      'Tarifa anual fija de $250 USD/año',
    ],
    limits: {
      max_products: 1000,
      max_images_per_product: 2,
      max_branches: 2,
      max_team_members: 3,
      custom_domain_allowed: false,
      custom_landing_allowed: false,
      bulk_import_allowed: true,
      support_priority: 'standard',
      max_storage_mb: 1500,
      analytics_enabled: false,
      remove_branding: false,
    },
  },
  {
    id: 'plan_2000',
    slug: 'plan_2000',
    name: 'Catálogo 2.000',
    description: 'Para grandes distribuidoras y fabricantes con múltiples sucursales y landing corporativa modular VIP.',
    price_monthly: 45.00,
    price_yearly: 450.00,
    currency: 'USD',
    badge: 'Avanzado',
    sort_order: 5,
    is_active: true,
    is_public: true,
    features: [
      'Todo lo incluido en el Plan 1.000',
      'Hasta 2.000 productos con hasta 4 fotos cada uno',
      'Landing corporativa modular personalizable (Landing VIP)',
      'Hasta 4 sucursales, plantas o CEDIs',
      'Hasta 5 usuarios administradores y vendedores',
      'Soporte prioritario con SLA de 24h',
      'Tarifa anual fija de $450 USD/año',
    ],
    limits: {
      max_products: 2000,
      max_images_per_product: 4,
      max_branches: 4,
      max_team_members: 5,
      custom_domain_allowed: false,
      custom_landing_allowed: true,
      bulk_import_allowed: true,
      support_priority: 'priority',
      max_storage_mb: 4000,
      analytics_enabled: true,
      remove_branding: false,
    },
  },
  {
    id: 'plan_enterprise',
    slug: 'enterprise',
    name: 'Corporativo Industrial',
    description: 'Para fabricantes y corporaciones industriales con alta demanda, dominio propio personalizado y soporte VIP 24/7.',
    price_monthly: 120.00,
    price_yearly: 1200.00,
    currency: 'USD',
    badge: 'Industrial',
    sort_order: 6,
    is_active: true,
    is_public: true,
    features: [
      'Todo lo incluido en el Plan 2.000',
      'Catálogo y productos ilimitados',
      'Fotos ilimitadas por producto + videos demostrativos',
      'Plantas, sucursales y bodegas ilimitadas',
      'Dominio propio personalizado (ej: miempresa.com)',
      'Sin marca de agua de Tenddy',
      'Telemetría de planta en vivo y mapa interactivo',
      'Usuarios de equipo comerciales ilimitados',
      'Soporte VIP dedicado con atención por WhatsApp 24/7',
      'Tarifa anual fija de $1.200 USD/año',
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
      max_storage_mb: 15000,
      analytics_enabled: true,
      remove_branding: true,
    },
  },
];

export const DEFAULT_PLAN_SLUG = 'plan_500';

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

/**
 * Obtiene la fecha límite de la promoción de lanzamiento (último día del mes en curso)
 */
export function getPromoDeadline(): { text: string; daysLeft: number; dateStr: string } {
  const now = new Date();
  // Último día del mes actual (año, mes + 1, día 0 = último día del mes)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  const diffTime = lastDay.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const monthsEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const monthName = monthsEs[lastDay.getMonth()];
  const formattedText = `${lastDay.getDate()} de ${monthName}`;
  const dateStr = lastDay.toISOString().split('T')[0];

  return {
    text: formattedText,
    daysLeft,
    dateStr,
  };
}

/**
 * Calcula el precio promocional con el 50% de descuento de lanzamiento
 */
export function getPlanPromoPrice(plan: Plan): {
  originalPrice: number;
  promoPrice: number;
  discountPercent: number;
  isPromo: boolean;
} {
  if (plan.price_yearly <= 0) {
    return {
      originalPrice: 0,
      promoPrice: 0,
      discountPercent: 0,
      isPromo: false,
    };
  }

  const promoPrice = Math.round(plan.price_yearly * 0.5);
  return {
    originalPrice: plan.price_yearly,
    promoPrice,
    discountPercent: 50,
    isPromo: true,
  };
}

/**
 * Construye la URL de WhatsApp para solicitar la activación o compra de un plan con la promo 50% OFF
 */
export function buildPlanWhatsAppUpgradeUrl({
  plan,
  tenantSlug,
  tenantName,
  phone = '0980065021', // Teléfono oficial de Tenddy
}: {
  plan: Plan;
  tenantSlug?: string;
  tenantName?: string;
  phone?: string;
}): string {
  const promo = getPlanPromoPrice(plan);
  const deadline = getPromoDeadline();

  let msg = `¡Hola Tenddy! 👋 `;
  if (tenantName || tenantSlug) {
    msg += `Quiero activar el *${plan.name}* para mi tienda *${tenantName || tenantSlug}* (${tenantSlug || ''}.tenddy.shop).\n\n`;
  } else {
    msg += `Quiero contratar el *${plan.name}* para mi empresa en Tenddy.\n\n`;
  }

  if (promo.isPromo) {
    msg += `🔥 *Promoción 50% OFF de Lanzamiento*: $${promo.promoPrice} USD/año (en lugar de $${promo.originalPrice} USD/año, válida hasta el ${deadline.text}).\n\n`;
  } else {
    msg += `Tarifa: $${plan.price_yearly} USD/año.\n\n`;
  }

  msg += `Por favor envíenme los datos de cuenta bancaria o link de cobro para realizar la transferencia.`;

  return buildEcuadorWhatsAppUrl(phone, msg);
}

