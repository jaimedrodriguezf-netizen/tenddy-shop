-- ==========================================================
-- Migración: 0016_harden_support_tickets_rls.sql
-- Propósito: Blindar Row Level Security (RLS) en support_tickets
--           para bloquear inserciones, actualizaciones y lecturas anónimas
--           directas vía la API pública de Supabase (anon).
--           Todas las operaciones se gestionan de forma segura
--           a través del backend de Next.js (service_role).
-- Idempotencia: 100% garantizada
-- ==========================================================

-- 1. Asegurar que Row Level Security está habilitado en support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas previas si existieran
DROP POLICY IF EXISTS "Deny anon select on support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Deny anon insert on support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Deny anon update or delete on support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Deny anon update on support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Deny anon delete on support_tickets" ON public.support_tickets;

-- 3. Crear políticas explícitas de bloqueo total para roles anónimos y públicos
CREATE POLICY "Deny anon select on support_tickets" ON public.support_tickets
    FOR SELECT USING (FALSE);

CREATE POLICY "Deny anon insert on support_tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (FALSE);

CREATE POLICY "Deny anon update on support_tickets" ON public.support_tickets
    FOR UPDATE USING (FALSE);

CREATE POLICY "Deny anon delete on support_tickets" ON public.support_tickets
    FOR DELETE USING (FALSE);

-- 4. Revocar privilegios directos de inserción/mutación al rol anon
REVOKE ALL ON public.support_tickets FROM anon;
