-- ==========================================================
-- TENDDY-SHOP: Analytics & Views Counter Engine
-- ==========================================================

-- 1. Agregar columna de vistas a la tabla tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS views_count BIGINT DEFAULT 0;

-- 2. Función atómica para incrementar visitas sin condiciones de carrera (Concurrency safe)
CREATE OR REPLACE FUNCTION increment_tenant_views(target_tenant_id UUID)
RETURNS BIGINT AS $$
DECLARE
    new_views BIGINT;
BEGIN
    UPDATE tenants
    SET views_count = COALESCE(views_count, 0) + 1,
        updated_at = NOW()
    WHERE id = target_tenant_id
    RETURNING views_count INTO new_views;
    
    RETURN new_views;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
