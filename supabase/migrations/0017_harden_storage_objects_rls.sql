-- ==========================================================
-- Migración: 0017_harden_storage_objects_rls.sql
-- Propósito: Revocar la política permisiva 'Admin manage support attachments'
--           en storage.objects para neutralizar la vulnerabilidad de mutaciones
--           y eliminaciones anónimas directas en el bucket 'support-attachments'.
--           Solo el backend de Next.js (service_role) puede subir/eliminar.
--           La lectura pública (SELECT) para servir imágenes permanece activa.
-- Idempotencia: 100% garantizada
-- ==========================================================

-- 1. Eliminar la política permisiva pública que permitía a cualquiera mutar o borrar archivos
DROP POLICY IF EXISTS "Admin manage support attachments" ON storage.objects;

-- 2. Asegurar que la política de sólo lectura pública para visualización CDN esté correctamente acotada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read support attachments'
    ) THEN
        CREATE POLICY "Public read support attachments"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'support-attachments');
    END IF;
END $$;
