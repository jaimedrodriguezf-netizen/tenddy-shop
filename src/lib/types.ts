export interface TenantSocialLinks {
  whatsapp_main?: string;
  whatsapp_display?: string;
  whatsapp_urgent?: string;
  whatsapp_welcome_msg?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  show_floating_whatsapp?: boolean;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  tax_id?: string;
  industry_type: string;
  logo_url: string;
  views_count?: number;
  plan_slug?: string;
  plan_status?: string;
  theme_config: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family?: string;
    border_radius?: string;
    show_best_sellers?: boolean;
    show_featured_ratings?: boolean;
    show_top_bar?: boolean;
    top_bar_text?: string;
    store_template?: string;
    custom_theme?: string;
    social_links?: TenantSocialLinks;
    packaging_unit?: PackagingUnit;
    custom_landing_unlocked?: boolean;
    is_decoupled?: boolean;
    decoupled_url?: string;
  };
  landing_config: {
    hero_title: string;
    hero_subtitle: string;
    hero_video_url?: string;
    hero_image_url?: string;
    whatsapp_default: string;
    display_phone?: string;
    international_phone?: string;
    email?: string;
    address?: string;
    hours?: string;
    plant_location?: string;
    show_top_bar?: boolean;
    top_bar_text?: string;
    social_links?: TenantSocialLinks;
    show_catalog?: boolean;
    show_branches?: boolean;
    show_services?: boolean;
    show_best_sellers?: boolean;
    show_featured_ratings?: boolean;
    sections?: LandingSectionsConfig;
  };
  settings: {
    currency: string;
    currency_symbol: string;
    enable_whatsapp_rfq?: boolean;
    brands?: Brand[];
    tags?: ProductTag[];
    attributes?: ProductAttribute[];
    reviews?: ProductReview[];
    [key: string]: any;
  };
}

export interface PackagingUnit {
  singular: string;
  plural: string;
}

export const PACKAGING_UNIT_PRESETS: { label: string; singular: string; plural: string }[] = [
  { label: '📦 Paquete', singular: 'Paquete', plural: 'Paquetes' },
  { label: '📦 Caja', singular: 'Caja', plural: 'Cajas' },
  { label: '🏭 Fardo', singular: 'Fardo', plural: 'Fardos' },
  { label: '🚚 Bulto', singular: 'Bulto', plural: 'Bultos' },
  { label: '🏷️ Pack', singular: 'Pack', plural: 'Packs' },
  { label: '🌾 Saco', singular: 'Saco', plural: 'Sacos' },
  { label: '🧵 Rollo', singular: 'Rollo', plural: 'Rollos' },
];

export function getPackagingUnit(tenant?: Partial<Tenant> | null): PackagingUnit {
  const custom = (tenant?.theme_config as any)?.packaging_unit;
  if (custom && typeof custom === 'object') {
    const s = typeof custom.singular === 'string' ? custom.singular.trim() : '';
    const p = typeof custom.plural === 'string' ? custom.plural.trim() : '';
    if (s && p) {
      return { singular: s, plural: p };
    }
  }

  // Fallback por defecto universal latinoamericano: Paquete / Paquetes
  return { singular: 'Paquete', plural: 'Paquetes' };
}

export interface Branch {
  id: string;
  slug: string;
  name: string;
  branch_type: string;
  city: string;
  address: string;
  phone_number?: string;
  phone_whatsapp: string;
  email?: string;
  is_main_branch: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
  image_url?: string;
  parent_id?: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at?: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  slug: string;
  enable_archives?: boolean;
  order_by?: string;
  terms: string[];
  created_at?: string;
}

export type ReviewStatus = 'approved' | 'pending' | 'spam' | 'trash';

export interface ProductReviewReply {
  content: string;
  author_name: string;
  created_at: string;
}

export interface ProductReview {
  id: string;
  tenant_id: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  type: 'review' | 'rating';
  author_name: string;
  author_email?: string;
  author_ip?: string;
  rating: number;
  content: string;
  status: ReviewStatus;
  reply?: ProductReviewReply | null;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id?: string;
  slug: string;
  name: string;
  sku?: string;
  description?: string;
  images: string[];
  attributes: {
    specs?: Record<string, string>;
    features?: string[];
    badge?: string;
    sector?: string;
    [key: string]: any;
  };
  min_order_qty: number;
  units_per_package: number;
  category_id?: string;
  price_tiers?: PriceTier[];
}

export interface PriceTier {
  min_qty: number;
  price: number;
}

export function resolveTieredPrice(
  priceTiers: PriceTier[] | undefined | null,
  quantity: number,
  fallbackPrice: number
): { unitPrice: number; activeTier?: PriceTier; savingsPercent?: number } {
  const safeFallback = typeof fallbackPrice === 'number' && !isNaN(fallbackPrice) && fallbackPrice > 0 ? fallbackPrice : 0;

  if (!Array.isArray(priceTiers) || priceTiers.length === 0) {
    return { unitPrice: safeFallback };
  }

  const validTiers = priceTiers
    .filter((t) => typeof t?.min_qty === 'number' && t.min_qty > 0 && typeof t?.price === 'number' && t.price > 0)
    .sort((a, b) => a.min_qty - b.min_qty);

  if (validTiers.length === 0) {
    return { unitPrice: safeFallback };
  }

  const basePrice = validTiers[0].price;

  // Buscar la escala más alta aplicable para la cantidad solicitada
  let matchedTier = validTiers[0];
  for (let i = validTiers.length - 1; i >= 0; i--) {
    if (quantity >= validTiers[i].min_qty) {
      matchedTier = validTiers[i];
      break;
    }
  }

  const savings = basePrice > matchedTier.price
    ? Math.round(((basePrice - matchedTier.price) / basePrice) * 100)
    : undefined;

  return {
    unitPrice: matchedTier.price,
    activeTier: matchedTier,
    savingsPercent: savings,
  };
}

export interface LandingTopBarSection {
  enabled: boolean;
  text: string;
  bg_color?: string;
}

export interface LandingHeaderSection {
  enabled: boolean;
  show_whatsapp_button: boolean;
  custom_subtitle?: string;
}

export interface LandingHeroSection {
  enabled: boolean;
  badge?: string;
  title_main?: string;
  title_highlight?: string;
  description?: string;
  cta_primary_text?: string;
  cta_secondary_text?: string;
  show_telemetry?: boolean;
  telemetry_plant_name?: string;
  telemetry_status?: string;
  telemetry_cadence?: string;
  telemetry_material?: string;
  telemetry_tooling?: string;
}

export interface LandingPillarItem {
  icon: string;
  title: string;
  desc: string;
}

export interface LandingPillarsSection {
  enabled: boolean;
  items: LandingPillarItem[];
}

export interface LandingRfqMapSection {
  enabled: boolean;
  title?: string;
  subtitle?: string;
  show_form?: boolean;
  show_map?: boolean;
  map_title?: string;
  map_embed_url?: string;
  schedule?: string;
  email?: string;
}

export interface LandingFooterSection {
  enabled: boolean;
  copyright_text?: string;
  show_powered_by?: boolean;
}

export interface LandingSectionsConfig {
  top_bar: LandingTopBarSection;
  header: LandingHeaderSection;
  hero: LandingHeroSection;
  pillars: LandingPillarsSection;
  rfq_and_map: LandingRfqMapSection;
  footer: LandingFooterSection;
}

export function getDefaultLandingSections(tenantName?: string, slug?: string): LandingSectionsConfig {
  const isAyme = slug === 'ayme-pet';
  const name = tenantName || (isAyme ? 'AYME INDUSTRIAS PET' : 'Fábrica Industrial');

  return {
    top_bar: {
      enabled: true,
      text: isAyme
        ? '🏭 Planta Industrial Calderón - Quito • Envíos Paletizados a todo el Ecuador'
        : `🏭 Planta Industrial ${name} • Envíos a todo el país`,
      bg_color: '#8C1625',
    },
    header: {
      enabled: true,
      show_whatsapp_button: !isAyme,
      custom_subtitle: isAyme ? 'Solutions in Packaging • B2B' : 'Producción Directa • B2B',
    },
    hero: {
      enabled: true,
      badge: 'SISTEMA: BLOW-MOLD ROTARY TURBINE • 40 BAR',
      title_main: 'TECNOLOGÍA EN',
      title_highlight: isAyme ? 'soplado & inyección' : 'producción y manufactura',
      description: isAyme
        ? 'Fabricación de envases, botellas, tapas y preformas en PET y PP con tecnología rotativa de alta velocidad para la industria alimentaria, cosmética y de limpieza.'
        : `Fabricación y distribución a escala industrial de productos y suministros para empresas y distribuidores.`,
      cta_primary_text: 'Solicitar Muestras & Cotización',
      cta_secondary_text: 'Ver Fases de Fabricación',
      show_telemetry: true,
      telemetry_plant_name: isAyme ? 'Planta Calderón' : 'Planta Matriz',
      telemetry_status: 'Operativa',
      telemetry_cadence: isAyme ? '+12.000 BPH' : 'Alta Capacidad B2B',
      telemetry_material: isAyme ? 'Resina PET 100% Virgen' : 'Materia Prima Certificada',
      telemetry_tooling: 'Diseño de Moldes 3D',
    },
    pillars: {
      enabled: true,
      items: [
        {
          icon: '🏆',
          title: 'Inocuidad & BPM',
          desc: 'Resina 100% virgen certificada para contacto alimentario y farmacéutico sin migración.',
        },
        {
          icon: '⚙️',
          title: 'Alta Cadencia Rotativa',
          desc: 'Capacidad de +12.000 BPH y mecanizado CNC de moldes con diseño exclusivo.',
        },
        {
          icon: '🚛',
          title: 'Logística & Despacho Nacional',
          desc: 'Entregas paletizadas seguras a todo el Ecuador y retiro directo en planta.',
        },
      ],
    },
    rfq_and_map: {
      enabled: true,
      title: 'Solicitud de Cotización & Muestras',
      subtitle: 'Atención directa de fábrica para pedidos por fardo, bulto o contenedor.',
      show_form: true,
      show_map: true,
      map_title: isAyme ? 'Ubicación de Planta & Retiro Directo' : 'Planta de Fabricación y Despacho',
      map_embed_url:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.816652458428!2d-78.4485!3d-0.0886!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMDUnMTkuMCJTIDc4wrAyNic1NC42Ilc!5e0!3m2!1ses!2sec!4v1620000000000!5m2!1ses!2sec',
      schedule: 'Lunes a Viernes: 08:00 - 17:30',
      email: isAyme ? 'ventas@aymeindustriaspet.com' : 'ventas@industria.com',
    },
    footer: {
      enabled: true,
      copyright_text: `© ${new Date().getFullYear()} ${name}. Todos los derechos reservados.`,
      show_powered_by: true,
    },
  };
}

export function resolveLandingSections(raw?: any, tenantName?: string, slug?: string): LandingSectionsConfig {
  const defaults = getDefaultLandingSections(tenantName, slug);
  if (!raw || typeof raw !== 'object') return defaults;

  return {
    top_bar: {
      enabled: raw.top_bar?.enabled !== undefined ? Boolean(raw.top_bar.enabled) : defaults.top_bar.enabled,
      text: typeof raw.top_bar?.text === 'string' && raw.top_bar.text.trim() ? raw.top_bar.text.trim() : defaults.top_bar.text,
      bg_color: raw.top_bar?.bg_color || defaults.top_bar.bg_color,
    },
    header: {
      enabled: raw.header?.enabled !== undefined ? Boolean(raw.header.enabled) : defaults.header.enabled,
      show_whatsapp_button: raw.header?.show_whatsapp_button !== undefined ? Boolean(raw.header.show_whatsapp_button) : defaults.header.show_whatsapp_button,
      custom_subtitle: typeof raw.header?.custom_subtitle === 'string' && raw.header.custom_subtitle.trim() ? raw.header.custom_subtitle.trim() : defaults.header.custom_subtitle,
    },
    hero: {
      enabled: raw.hero?.enabled !== undefined ? Boolean(raw.hero.enabled) : defaults.hero.enabled,
      badge: typeof raw.hero?.badge === 'string' && raw.hero.badge.trim() ? raw.hero.badge.trim() : defaults.hero.badge,
      title_main: typeof raw.hero?.title_main === 'string' && raw.hero.title_main.trim() ? raw.hero.title_main.trim() : defaults.hero.title_main,
      title_highlight: typeof raw.hero?.title_highlight === 'string' && raw.hero.title_highlight.trim() ? raw.hero.title_highlight.trim() : defaults.hero.title_highlight,
      description: typeof raw.hero?.description === 'string' && raw.hero.description.trim() ? raw.hero.description.trim() : defaults.hero.description,
      cta_primary_text: typeof raw.hero?.cta_primary_text === 'string' && raw.hero.cta_primary_text.trim() ? raw.hero.cta_primary_text.trim() : defaults.hero.cta_primary_text,
      cta_secondary_text: typeof raw.hero?.cta_secondary_text === 'string' && raw.hero.cta_secondary_text.trim() ? raw.hero.cta_secondary_text.trim() : defaults.hero.cta_secondary_text,
      show_telemetry: raw.hero?.show_telemetry !== undefined ? Boolean(raw.hero.show_telemetry) : defaults.hero.show_telemetry,
      telemetry_plant_name: typeof raw.hero?.telemetry_plant_name === 'string' && raw.hero.telemetry_plant_name.trim() ? raw.hero.telemetry_plant_name.trim() : defaults.hero.telemetry_plant_name,
      telemetry_status: typeof raw.hero?.telemetry_status === 'string' && raw.hero.telemetry_status.trim() ? raw.hero.telemetry_status.trim() : defaults.hero.telemetry_status,
      telemetry_cadence: typeof raw.hero?.telemetry_cadence === 'string' && raw.hero.telemetry_cadence.trim() ? raw.hero.telemetry_cadence.trim() : defaults.hero.telemetry_cadence,
      telemetry_material: typeof raw.hero?.telemetry_material === 'string' && raw.hero.telemetry_material.trim() ? raw.hero.telemetry_material.trim() : defaults.hero.telemetry_material,
      telemetry_tooling: typeof raw.hero?.telemetry_tooling === 'string' && raw.hero.telemetry_tooling.trim() ? raw.hero.telemetry_tooling.trim() : defaults.hero.telemetry_tooling,
    },
    pillars: {
      enabled: raw.pillars?.enabled !== undefined ? Boolean(raw.pillars.enabled) : defaults.pillars.enabled,
      items: Array.isArray(raw.pillars?.items) && raw.pillars.items.length > 0
        ? raw.pillars.items.map((item: any, idx: number) => ({
            icon: typeof item?.icon === 'string' && item.icon.trim() ? item.icon.trim() : defaults.pillars.items[idx]?.icon || '✨',
            title: typeof item?.title === 'string' && item.title.trim() ? item.title.trim() : defaults.pillars.items[idx]?.title || 'Pilar de Calidad',
            desc: typeof item?.desc === 'string' && item.desc.trim() ? item.desc.trim() : defaults.pillars.items[idx]?.desc || '',
          }))
        : defaults.pillars.items,
    },
    rfq_and_map: {
      enabled: raw.rfq_and_map?.enabled !== undefined ? Boolean(raw.rfq_and_map.enabled) : defaults.rfq_and_map.enabled,
      title: typeof raw.rfq_and_map?.title === 'string' && raw.rfq_and_map.title.trim() ? raw.rfq_and_map.title.trim() : defaults.rfq_and_map.title,
      subtitle: typeof raw.rfq_and_map?.subtitle === 'string' && raw.rfq_and_map.subtitle.trim() ? raw.rfq_and_map.subtitle.trim() : defaults.rfq_and_map.subtitle,
      show_form: raw.rfq_and_map?.show_form !== undefined ? Boolean(raw.rfq_and_map.show_form) : defaults.rfq_and_map.show_form,
      show_map: raw.rfq_and_map?.show_map !== undefined ? Boolean(raw.rfq_and_map.show_map) : defaults.rfq_and_map.show_map,
      map_title: typeof raw.rfq_and_map?.map_title === 'string' && raw.rfq_and_map.map_title.trim() ? raw.rfq_and_map.map_title.trim() : defaults.rfq_and_map.map_title,
      map_embed_url: typeof raw.rfq_and_map?.map_embed_url === 'string' && raw.rfq_and_map.map_embed_url.trim() ? raw.rfq_and_map.map_embed_url.trim() : defaults.rfq_and_map.map_embed_url,
      schedule: typeof raw.rfq_and_map?.schedule === 'string' && raw.rfq_and_map.schedule.trim() ? raw.rfq_and_map.schedule.trim() : defaults.rfq_and_map.schedule,
      email: typeof raw.rfq_and_map?.email === 'string' && raw.rfq_and_map.email.trim() ? raw.rfq_and_map.email.trim() : defaults.rfq_and_map.email,
    },
    footer: {
      enabled: raw.footer?.enabled !== undefined ? Boolean(raw.footer.enabled) : defaults.footer.enabled,
      copyright_text: typeof raw.footer?.copyright_text === 'string' && raw.footer.copyright_text.trim() ? raw.footer.copyright_text.trim() : defaults.footer.copyright_text,
      show_powered_by: raw.footer?.show_powered_by !== undefined ? Boolean(raw.footer.show_powered_by) : defaults.footer.show_powered_by,
    },
  };
}

// ==========================================================
// TENDDY SAAS: Planes & Precios (Engine)
// ==========================================================

export interface PlanLimits {
  max_products: number; // -1 = ilimitado
  max_images_per_product?: number; // -1 = ilimitado (ej: 2 en Gratis, 1 en Esencial, etc.)
  max_branches: number; // -1 = ilimitado
  max_team_members: number; // -1 = ilimitado
  custom_domain_allowed: boolean;
  custom_landing_allowed: boolean;
  bulk_import_allowed: boolean;
  support_priority: 'standard' | 'priority' | 'dedicated_24_7';
  max_storage_mb: number;
  analytics_enabled?: boolean;
  remove_branding?: boolean;
  [key: string]: any;
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  badge?: string;
  sort_order: number;
  is_active: boolean;
  is_public: boolean;
  features: string[];
  limits: PlanLimits;
  created_at?: string;
  updated_at?: string;
}

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
export type BillingCycle = 'monthly' | 'yearly' | 'custom';

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_id?: string;
  plan_slug: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  price_paid: number;
  currency: string;
  started_at: string;
  current_period_start: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  plans?: Plan;
  tenants?: {
    name: string;
    slug: string;
  };
}
