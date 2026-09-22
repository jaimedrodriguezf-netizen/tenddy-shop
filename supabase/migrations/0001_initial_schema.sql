-- ==========================================================
-- Tenddy Shop: Multi-Tenant, Multi-Sucursal, Multi-Domain Schema
-- Flexible B2B E-commerce Engine (PostgreSQL 17)
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS TABLE (Agnóstico de industria)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,           -- e.g. "plastpet", "dulcelandia"
    name VARCHAR(255) NOT NULL,                 -- e.g. "PlastPET Industrial S.A.S"
    industry_type VARCHAR(64) NOT NULL,         -- e.g. "plastics", "confectionery", "general"
    logo_url TEXT,
    favicon_url TEXT,
    
    -- Configuración dinámica de theming (colores, fuentes, estilo)
    theme_config JSONB DEFAULT '{
        "primary_color": "#0066FF",
        "secondary_color": "#00E5FF",
        "accent_color": "#10B981",
        "font_family": "Inter, sans-serif",
        "border_radius": "0.5rem"
    }'::jsonb,

    -- Configuración dinámica del Landing Page (Hero, Secciones, Textos, Banners)
    landing_config JSONB DEFAULT '{
        "hero_title": "Catálogo Industrial y Soluciones de Fabricación",
        "hero_subtitle": "Venta directa de fábrica con despacho nacional e internacional",
        "hero_video_url": null,
        "hero_image_url": null,
        "whatsapp_default": null,
        "show_catalog": true,
        "show_branches": true,
        "show_services": true
    }'::jsonb,

    -- Configuración B2B (moneda, pedido mínimo global, etc.)
    settings JSONB DEFAULT '{
        "currency": "COP",
        "currency_symbol": "$",
        "requires_quote_approval": true,
        "enable_whatsapp_rfq": true
    }'::jsonb,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TENANT DOMAINS (Soporte multi-dominio: custom domains y subdominios)
CREATE TABLE IF NOT EXISTS tenant_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,        -- e.g. "plastpet.com", "plastpet.tenddy.shop"
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT TRUE,
    ssl_status VARCHAR(32) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BRANCHES TABLE (Multi-Sucursal / Plantas / Bodegas)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slug VARCHAR(64) NOT NULL,                  -- e.g. "planta-cali", "bodega-bogota"
    name VARCHAR(255) NOT NULL,                 -- e.g. "Planta Principal Cali"
    branch_type VARCHAR(64) DEFAULT 'plant',    -- "plant", "warehouse", "store", "office"
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone_number VARCHAR(50),
    phone_whatsapp VARCHAR(50) NOT NULL,        -- Número de WhatsApp que recibe las cotizaciones locales
    email VARCHAR(255),
    is_main_branch BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

-- 4. CATEGORIES TABLE (Jerarquía de catálogo por Tenant)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slug VARCHAR(128) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

-- 5. PRODUCTS TABLE (Agnóstico con atributos JSONB)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    slug VARCHAR(128) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(64),
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,           -- Array de URLs de imágenes
    technical_sheet_url TEXT,                    -- PDF de ficha técnica

    -- Atributos flexibles según la industria
    -- Para Plásticos: { "material": "PET", "capacidad": "500ml", "boca": "28mm PCO 1881", "gramaje": "24g" }
    -- Para Confitería: { "sabor": "Fresa", "presentacion": "Bolsa 50 uds", "peso_neto": "500g", "vida_util": "12m" }
    attributes JSONB DEFAULT '{}'::jsonb,

    -- Escalas de precios por volumen (B2B Price Tiers)
    -- Ej: [{"min_qty": 100, "price": 450}, {"min_qty": 1000, "price": 380}, {"min_qty": 5000, "price": 320}]
    price_tiers JSONB DEFAULT '[]'::jsonb,

    min_order_qty INT DEFAULT 1,                -- MOQ (Cantidad Mínima de Pedido)
    units_per_package INT DEFAULT 1,            -- Unidades por fardo/caja/paquete
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

-- 6. BRANCH INVENTORY (Inventario / Disponibilidad por Sucursal)
CREATE TABLE IF NOT EXISTS branch_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    stock_units INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    lead_time_days INT DEFAULT 3,               -- Días estimados de fabricación/despacho si no hay stock
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, product_id)
);

-- 7. QUOTES TABLE (Cotizaciones B2B / Leads)
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    quote_number VARCHAR(32) NOT NULL,          -- e.g. "COT-2026-0001"
    
    -- Datos del cliente / empresa solicitante
    customer_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    tax_id VARCHAR(50),                         -- NIT / RUT / RFC
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    delivery_city VARCHAR(100),
    delivery_address TEXT,
    
    notes TEXT,
    status VARCHAR(32) DEFAULT 'pending',       -- pending, contacted, quoted, approved, rejected
    items JSONB NOT NULL DEFAULT '[]'::jsonb,   -- Array con snapshot de productos y cantidades cotizadas
    estimated_total NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de alto rendimiento para enrutamiento y búsquedas
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON tenant_domains(domain);
CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON quotes(tenant_id);
