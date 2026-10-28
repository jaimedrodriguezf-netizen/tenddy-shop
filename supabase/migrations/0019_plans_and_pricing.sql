-- ==========================================================
-- Migración: 0019_plans_and_pricing.sql
-- Propósito: Módulo de Planes y Precios SaaS para Tenddy
-- Idempotencia: 100% garantizada (Regla 10x)
-- ==========================================================

-- 1. TABLA DE PLANES (Catálogo de planes comerciales del SaaS)
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    badge VARCHAR(64),
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    limits JSONB NOT NULL DEFAULT '{
        "max_products": 50,
        "max_branches": 1,
        "max_team_members": 2,
        "custom_domain_allowed": false,
        "custom_landing_allowed": false,
        "bulk_import_allowed": false,
        "support_priority": "standard",
        "max_storage_mb": 250,
        "analytics_enabled": false,
        "remove_branding": false
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA DE SUSCRIPCIONES POR TENANT (Historial y estado contractual)
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.plans(id) ON DELETE RESTRICT,
    plan_slug VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- active, trialing, past_due, canceled, paused
    billing_cycle VARCHAR(16) NOT NULL DEFAULT 'monthly', -- monthly, yearly, custom
    price_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. COLUMNAS DE CACHÉ / ACCESO DIRECTO EN TENANTS (Evita joins pesados en lecturas críticas)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan_slug VARCHAR(64) DEFAULT 'starter';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan_status VARCHAR(32) DEFAULT 'active';

-- 4. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_plans_slug ON public.plans(slug);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON public.plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_sort_order ON public.plans(sort_order);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON public.tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON public.tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_slug ON public.tenants(plan_slug);

-- 5. BLINDAJE DE SEGURIDAD Y POLÍTICAS RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Planes: lectura pública permitida para planes activos y públicos (landings, cotizaciones, onboarding)
DROP POLICY IF EXISTS "Public can view active plans" ON public.plans;
CREATE POLICY "Public can view active plans" ON public.plans
    FOR SELECT
    USING (is_active = TRUE AND is_public = TRUE);

-- Planes: mutaciones bloqueadas para usuarios anónimos (solo service_role / superadmin)
DROP POLICY IF EXISTS "Deny anon mutations on plans" ON public.plans;
CREATE POLICY "Deny anon mutations on plans" ON public.plans
    FOR ALL
    TO anon
    USING (FALSE);

-- Suscripciones: restringidas contra accesos anónimos
DROP POLICY IF EXISTS "Deny anon on tenant_subscriptions" ON public.tenant_subscriptions;
CREATE POLICY "Deny anon on tenant_subscriptions" ON public.tenant_subscriptions
    FOR ALL
    TO anon
    USING (FALSE);

-- 6. SEMILLAS (SEEDS) INICIALES IDEMPOTENTES
INSERT INTO public.plans (
    slug,
    name,
    description,
    price_monthly,
    price_yearly,
    currency,
    badge,
    sort_order,
    is_active,
    is_public,
    features,
    limits
) VALUES 
(
    'essential',
    'Catálogo Esencial',
    'Para pequeños talleres y artesanos que buscan digitalizar sus productos y vender por WhatsApp con tarifa ultra accesible.',
    10.00,
    100.00,
    'USD',
    'Económico',
    1,
    TRUE,
    TRUE,
    '[
        "Catálogo digital móvil y web optimizado",
        "Hasta 25 productos con fotos y descripción",
        "Botón directo de cotización a WhatsApp",
        "1 Sucursal o taller matriz",
        "1 Usuario administrador",
        "Subdominio tenddy.shop incluido",
        "Soporte estándar vía Mesa de Ayuda",
        "Tarifa anual preferencial de $100 USD/año"
    ]'::jsonb,
    '{
        "max_products": 25,
        "max_branches": 1,
        "max_team_members": 1,
        "custom_domain_allowed": false,
        "custom_landing_allowed": false,
        "bulk_import_allowed": false,
        "support_priority": "standard",
        "max_storage_mb": 150,
        "analytics_enabled": false,
        "remove_branding": false
    }'::jsonb
),
(
    'starter',
    'Catálogo Starter',
    'Ideal para fábricas y distribuidores en crecimiento con catálogo mediano.',
    29.00,
    290.00,
    'USD',
    'Crecimiento',
    2,
    TRUE,
    TRUE,
    '[
        "Catálogo digital responsivo móvil y desktop",
        "Hasta 100 productos con variantes y fotos",
        "Cotizaciones directas a WhatsApp por sucursal",
        "1 Sucursal o Planta matriz",
        "Hasta 2 miembros de equipo comercial",
        "Subdominio tenddy.shop incluido",
        "Soporte estándar vía Mesa de Ayuda"
    ]'::jsonb,
    '{
        "max_products": 100,
        "max_branches": 1,
        "max_team_members": 2,
        "custom_domain_allowed": false,
        "custom_landing_allowed": false,
        "bulk_import_allowed": false,
        "support_priority": "standard",
        "max_storage_mb": 350,
        "analytics_enabled": false,
        "remove_branding": false
    }'::jsonb
),
(
    'pro',
    'E-Commerce B2B Pro',
    'Para empresas consolidadas que requieren importación masiva, landing corporativa y cotizaciones avanzadas.',
    69.00,
    690.00,
    'USD',
    'Más Popular',
    3,
    TRUE,
    TRUE,
    '[
        "Todo lo incluido en Starter",
        "Hasta 500 productos con stock por planta",
        "Importación y exportación masiva en Excel oficial",
        "Landing corporativa modular personalizable",
        "Hasta 3 sucursales o centros de distribución",
        "Hasta 5 usuarios administradores y vendedores",
        "Portal de clientes B2B con precios por volumen",
        "Soporte prioritario con SLA de 24h"
    ]'::jsonb,
    '{
        "max_products": 500,
        "max_branches": 3,
        "max_team_members": 5,
        "custom_domain_allowed": false,
        "custom_landing_allowed": true,
        "bulk_import_allowed": true,
        "support_priority": "priority",
        "max_storage_mb": 1024,
        "analytics_enabled": true,
        "remove_branding": false
    }'::jsonb
),
(
    'enterprise',
    'Corporativo Industrial',
    'Para fabricantes y grandes plantas industriales con alta demanda, dominio propio y soporte 24/7.',
    179.00,
    1790.00,
    'USD',
    'Industrial',
    4,
    TRUE,
    TRUE,
    '[
        "Todo lo incluido en Pro",
        "Catálogo y productos ilimitados",
        "Plantas, sucursales y bodegas ilimitadas",
        "Dominio propio personalizado (ej: miempresa.com)",
        "Sin marca de agua de Tenddy",
        "Telemetría de planta en vivo y video corporativo",
        "Usuarios de equipo ilimitados con roles B2B",
        "Soporte VIP dedicado con atención por WhatsApp 24/7"
    ]'::jsonb,
    '{
        "max_products": -1,
        "max_branches": -1,
        "max_team_members": -1,
        "custom_domain_allowed": true,
        "custom_landing_allowed": true,
        "bulk_import_allowed": true,
        "support_priority": "dedicated_24_7",
        "max_storage_mb": 5120,
        "analytics_enabled": true,
        "remove_branding": true
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    badge = EXCLUDED.badge,
    sort_order = EXCLUDED.sort_order;
