-- ==========================================================
-- TENDDY-SHOP: Security Hardening, RLS & Foreign Key Indexes
-- ==========================================================

-- 1. HARDENING DE FUNCIONES: fijar search_path y revocar acceso público/anon/authenticated directo
ALTER FUNCTION public.increment_tenant_views(uuid) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.increment_tenant_views(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_tenant_views(uuid) TO service_role;

-- 2. POLÍTICAS RLS EXPLÍCITAS EN TABLAS B2B
ALTER TABLE b2b_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_tenant_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'b2b_accounts' AND policyname = 'Deny anon on b2b_accounts'
    ) THEN
        CREATE POLICY "Deny anon on b2b_accounts" ON b2b_accounts FOR ALL USING (FALSE);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'b2b_tenant_customers' AND policyname = 'Deny anon on b2b_tenant_customers'
    ) THEN
        CREATE POLICY "Deny anon on b2b_tenant_customers" ON b2b_tenant_customers FOR ALL USING (FALSE);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'tenant_members' AND policyname = 'Deny anon on tenant_members'
    ) THEN
        CREATE POLICY "Deny anon on tenant_members" ON tenant_members FOR ALL USING (FALSE);
    END IF;
END $$;

-- 3. ÍNDICES CUBRIENTES PARA TODAS LAS CLAVES FORÁNEAS (Mejora de performance)
CREATE INDEX IF NOT EXISTS idx_b2b_tenant_customers_branch ON b2b_tenant_customers(assigned_branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_inventory_product ON branch_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_quotes_assigned_member ON quotes(assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_quotes_b2b_account ON quotes(b2b_account_id);
CREATE INDEX IF NOT EXISTS idx_quotes_branch ON quotes(branch_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_branch ON tenant_members(branch_id);
