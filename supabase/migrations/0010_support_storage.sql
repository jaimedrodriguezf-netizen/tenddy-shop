-- ==========================================================
-- TENDDY-SHOP: Storage Bucket for Support Attachments
-- ==========================================================

-- Insert bucket 'support-attachments' if it does not already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to support attachments
CREATE POLICY "Public read support attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'support-attachments');

-- Policy: Allow service_role to manage support attachments
CREATE POLICY "Admin manage support attachments"
ON storage.objects FOR ALL
USING (bucket_id = 'support-attachments');
