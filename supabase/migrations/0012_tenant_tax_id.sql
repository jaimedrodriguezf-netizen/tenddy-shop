-- ==========================================================
-- TENDDY: Add tax_id (RUC / NIT) to tenants table
-- ==========================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tax_id VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_tenants_tax_id ON tenants(tax_id);
