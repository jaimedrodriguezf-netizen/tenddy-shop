-- ==========================================================
-- TENDDY-SHOP: RBAC & B2B Buyer Universal Account Engine
-- ==========================================================

-- 1. TABLA DE CUENTAS / EMPRESAS COMPRADORAS (B2B Accounts)
-- Representa a la empresa cliente (ej: "Embotelladora Andina S.A.")
CREATE TABLE IF NOT EXISTS b2b_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(64) UNIQUE,                 -- NIT / RUT / RUC único de la empresa
    business_type VARCHAR(100),                -- e.g. "Embotelladora", "Distribuidora Mayorista"
    billing_address TEXT,
    billing_city VARCHAR(100),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,        -- Email corporativo principal
    password_hash TEXT,                        -- Clave de acceso para su portal de comprador
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RELACIÓN CLIENTE <-> TIENDA PROVEEDORA (B2B Relationships)
-- Un cliente compra en PlastPET (Tenant 1) y en Dulcelandia (Tenant 2)
CREATE TABLE IF NOT EXISTS b2b_tenant_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES b2b_accounts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL, -- Sucursal que lo atiende habitualmente
    
    -- Condiciones comerciales personalizadas por tienda proveedora
    customer_tier VARCHAR(32) DEFAULT 'standard', -- "standard", "vip", "distributor"
    discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    credit_days INT DEFAULT 0,                 -- Días de crédito comercial (0 = contado, 30 días, etc.)
    status VARCHAR(32) DEFAULT 'active',       -- "pending_approval", "active", "suspended"
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, tenant_id)
);

-- 3. TABLA DE ROLES DEL EQUIPO INTERNO DE LA FÁBRICA / PROVEEDOR (Tenant Members)
-- Dueño, Administrador, Asesor de Ventas
CREATE TABLE IF NOT EXISTS tenant_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL, -- Si es vendedor, a qué sucursal pertenece
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    password_hash TEXT NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'sales', -- "owner", "admin", "sales", "viewer"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- 4. Vincular cotizaciones a la cuenta B2B si está registrado
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS b2b_account_id UUID REFERENCES b2b_accounts(id) ON DELETE SET NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS assigned_member_id UUID REFERENCES tenant_members(id) ON DELETE SET NULL;

-- 5. Habilitar RLS en las nuevas tablas
ALTER TABLE b2b_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_tenant_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- 6. Índices para alto rendimiento
CREATE INDEX IF NOT EXISTS idx_b2b_tenant_customers_account ON b2b_tenant_customers(account_id);
CREATE INDEX IF NOT EXISTS idx_b2b_tenant_customers_tenant ON b2b_tenant_customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_email ON tenant_members(email);
