-- ==========================================================
-- TENDDY-SHOP: Storage Bucket for Support Attachments
-- ==========================================================

-- Insert bucket 'support-attachments' if it does not already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

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

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin manage support attachments'
    ) THEN
        CREATE POLICY "Admin manage support attachments"
        ON storage.objects FOR ALL
        USING (bucket_id = 'support-attachments');
    END IF;
END $$;

