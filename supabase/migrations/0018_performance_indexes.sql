-- ==========================================================
-- Migración: 0018_performance_indexes.sql
-- Propósito: Crear índices compuestos en PostgreSQL para acelerar
--           consultas de catálogo, búsqueda por SKU y panel de cotizaciones
-- Idempotencia: 100% garantizada
-- ==========================================================

-- 1. Acelerar consulta principal de catálogo público B2B (filtro activo + ordenación por fecha)
CREATE INDEX IF NOT EXISTS idx_products_tenant_active_created 
ON public.products (tenant_id, is_active, created_at DESC);

-- 2. Acelerar búsqueda y deduplicación por SKU en carga masiva y edición
CREATE INDEX IF NOT EXISTS idx_products_tenant_sku 
ON public.products (tenant_id, sku);

-- 3. Acelerar bandeja de cotizaciones en panel administrativo
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_created 
ON public.quotes (tenant_id, created_at DESC);
