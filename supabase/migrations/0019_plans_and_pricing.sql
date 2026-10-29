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
    'free',
    'Plan Gratuito',
    'Para probar la plataforma y comenzar a recibir pedidos por WhatsApp sin costo.',
    0.00,
    0.00,
    'USD',
    'Gratis',
    1,
    TRUE,
    TRUE,
    '[
        "Catálogo digital móvil y web optimizado",
        "Hasta 10 productos con 2 fotos cada uno",
        "Botón directo de cotización a WhatsApp",
        "1 Sucursal o taller matriz",
        "1 Usuario administrador",
        "Subdominio tenddy.shop incluido",
        "100% Gratis sin tarjeta de crédito"
    ]'::jsonb,
    '{
        "max_products": 10,
        "max_images_per_product": 2,
        "max_branches": 1,
        "max_team_members": 1,
        "custom_domain_allowed": false,
        "custom_landing_allowed": false,
        "bulk_import_allowed": false,
        "support_priority": "standard",
        "max_storage_mb": 50,
        "analytics_enabled": false,
        "remove_branding": false
    }'::jsonb
),
(
    'plan_100',
    'Catálogo 100',
    'Para talleres y pequeños comercios que inician su catálogo digital con tarifa anual súper accesible.',
    5.00,
    50.00,
    'USD',
    'Económico',
    2,
    TRUE,
    TRUE,
    '[
        "Catálogo digital móvil y web optimizado",
        "Hasta 100 productos con 1 foto principal",
        "Botón directo de cotización a WhatsApp",
        "1 Sucursal o taller matriz",
        "1 Usuario administrador",
        "Subdominio tenddy.shop incluido",
        "Soporte estándar vía Mesa de Ayuda",
        "Tarifa anual fija de $50 USD/año"
    ]'::jsonb,
    '{
        "max_products": 100,
        "max_images_per_product": 1,
        "max_branches": 1,
        "max_team_members": 1,
        "custom_domain_allowed": false,
        "custom_landing_allowed": false,
        "bulk_import_allowed": false,
        "support_priority": "standard",
        "max_storage_mb": 200,
        "analytics_enabled": false,
        "remove_branding": false
    }'::jsonb
),
(
    'plan_500',
    'Catálogo 500',
    'Ideal para talleres y distribuidores que buscan digitalizar su catálogo completo de hasta 500 productos.',
    10.00,
    100.00,
    'USD',
    'Más Popular',
    3,
    TRUE,
    TRUE,
    '[
        "Catálogo digital móvil y web optimizado",
        "Hasta 500 productos con 1 foto principal",
        "Botón directo de cotización a WhatsApp",
        "1 Sucursal o planta matriz",
        "1 Usuario administrador",
        "Subdominio tenddy.shop incluido",
        "Soporte estándar vía Mesa de Ayuda",
        "Tarifa anual fija de $100 USD/año"
    ]'::jsonb,
    '{
        "max_products": 500,
        "max_images_per_product": 1,
        "max_branches": 1,
        "max_team_members": 1,
        "custom_domain_allowed": false,
        "custom_landing_allowed": false,
        "bulk_import_allowed": false,
        "support_priority": "standard",
        "max_storage_mb": 500,
        "analytics_enabled": false,
        "remove_branding": false
    }'::jsonb
),
(
    'plan_1000',
    'Catálogo 1.000',
    'Para empresas con catálogos amplios que requieren importación masiva en Excel oficial.',
    25.00,
    250.00,
    'USD',
    'Crecimiento',
    4,
    TRUE,
    TRUE,
    '[
        "Todo lo incluido en el Plan 500",
        "Hasta 1.000 productos con 2 fotos cada uno",
        "Importación y exportación masiva oficial en Excel (.xlsx)",
        "Hasta 2 sucursales o plantas",
        "Hasta 3 usuarios de equipo comercial",
        "Soporte estándar vía Mesa de Ayuda",
        "Tarifa anual fija de $250 USD/año"
    ]'::jsonb,
    '{
        "max_products": 1000,
        "max_images_per_product": 2,
        "max_branches": 2,
        "max_team_members": 3,
        "custom_domain_allowed": false,
        "custom_landing_allowed": false,
        "bulk_import_allowed": true,
        "support_priority": "standard",
        "max_storage_mb": 1500,
        "analytics_enabled": false,
        "remove_branding": false
    }'::jsonb
),
(
    'plan_2000',
    'Catálogo 2.000',
    'Para grandes distribuidoras y fabricantes con múltiples sucursales y landing corporativa modular VIP.',
    45.00,
    450.00,
    'USD',
    'Avanzado',
    5,
    TRUE,
    TRUE,
    '[
        "Todo lo incluido en el Plan 1.000",
        "Hasta 2.000 productos con hasta 4 fotos cada uno",
        "Landing corporativa modular personalizable (Landing VIP)",
        "Hasta 4 sucursales, plantas o CEDIs",
        "Hasta 5 usuarios administradores y vendedores",
        "Soporte prioritario con SLA de 24h",
        "Tarifa anual fija de $450 USD/año"
    ]'::jsonb,
    '{
        "max_products": 2000,
        "max_images_per_product": 4,
        "max_branches": 4,
        "max_team_members": 5,
        "custom_domain_allowed": false,
        "custom_landing_allowed": true,
        "bulk_import_allowed": true,
        "support_priority": "priority",
        "max_storage_mb": 4000,
        "analytics_enabled": true,
        "remove_branding": false
    }'::jsonb
),
(
    'enterprise',
    'Corporativo Industrial',
    'Para fabricantes y corporaciones industriales con alta demanda, dominio propio personalizado y soporte VIP 24/7.',
    120.00,
    1200.00,
    'USD',
    'Industrial',
    6,
    TRUE,
    TRUE,
    '[
        "Todo lo incluido en el Plan 2.000",
        "Catálogo y productos ilimitados",
        "Fotos ilimitadas por producto + videos demostrativos",
        "Plantas, sucursales y bodegas ilimitadas",
        "Dominio propio personalizado (ej: miempresa.com)",
        "Sin marca de agua de Tenddy",
        "Telemetría de planta en vivo y mapa interactivo",
        "Usuarios de equipo comerciales ilimitados",
        "Soporte VIP dedicado con atención por WhatsApp 24/7",
        "Tarifa anual fija de $1.200 USD/año"
    ]'::jsonb,
    '{
        "max_products": -1,
        "max_images_per_product": -1,
        "max_branches": -1,
        "max_team_members": -1,
        "custom_domain_allowed": true,
        "custom_landing_allowed": true,
        "bulk_import_allowed": true,
        "support_priority": "dedicated_24_7",
        "max_storage_mb": 15000,
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
