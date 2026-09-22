-- ==========================================================
-- TENDDY-SHOP: Hardening & Row Level Security (RLS)
-- Protección de datos multi-tenant en Supabase PostgreSQL
-- ==========================================================

-- 1. Habilitar RLS en todas las tablas públicas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas previas si existieran
DROP POLICY IF EXISTS "Public can view active tenants" ON tenants;
DROP POLICY IF EXISTS "Public can view verified domains" ON tenant_domains;
DROP POLICY IF EXISTS "Public can view active branches" ON branches;
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Public can view branch inventory" ON branch_inventory;
DROP POLICY IF EXISTS "Deny public access to quotes" ON quotes;
DROP POLICY IF EXISTS "Allow quote submission through API only" ON quotes;

-- 3. Políticas de Lectura Pública (Catálogo B2B abierto a compradores)
-- Los compradores pueden ver tiendas activas, productos y sucursales
CREATE POLICY "Public can view active tenants" ON tenants
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view verified domains" ON tenant_domains
    FOR SELECT USING (is_verified = TRUE);

CREATE POLICY "Public can view active branches" ON branches
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view active categories" ON categories
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view branch inventory" ON branch_inventory
    FOR SELECT USING (is_available = TRUE);

-- 4. Protección Blindada para Cotizaciones (QUOTES)
-- Por defecto nadie con la clave anon puede leer la tabla quotes (previene robo de leads/clientes)
-- El acceso a quotes queda restringido al backend con SUPABASE_SERVICE_ROLE_KEY
CREATE POLICY "Deny anon select on quotes" ON quotes
    FOR SELECT USING (FALSE);

CREATE POLICY "Deny anon update or delete on quotes" ON quotes
    FOR UPDATE USING (FALSE);

-- Nota: El backend de Next.js (con service_role) tiene bypass nativo de RLS,
-- por lo que lee y escribe de forma 100% segura en el servidor.
