-- ==========================================================
-- Migración: 0015_harden_ticket_comments_rls.sql
-- Propósito: Habilitar Row Level Security (RLS) en ticket_comments
--           para neutralizar la fuga de mensajes y comentarios de soporte vía anon
-- Idempotencia: 100% garantizada
-- ==========================================================

-- 1. Habilitar Row Level Security en ticket_comments
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas previas si existieran
DROP POLICY IF EXISTS "Deny anon select on ticket_comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Deny anon insert on ticket_comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Deny anon update on ticket_comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Deny anon delete on ticket_comments" ON public.ticket_comments;

-- 3. Crear políticas explícitas de bloqueo total para roles anónimos y públicos
--    (El backend de Next.js accede mediante service_role que tiene bypass de RLS nativo)
CREATE POLICY "Deny anon select on ticket_comments" ON public.ticket_comments
    FOR SELECT USING (FALSE);

CREATE POLICY "Deny anon insert on ticket_comments" ON public.ticket_comments
    FOR INSERT WITH CHECK (FALSE);

CREATE POLICY "Deny anon update on ticket_comments" ON public.ticket_comments
    FOR UPDATE USING (FALSE);

CREATE POLICY "Deny anon delete on ticket_comments" ON public.ticket_comments
    FOR DELETE USING (FALSE);

-- 4. Revocar privilegios directos al rol anon
REVOKE ALL ON public.ticket_comments FROM anon;
