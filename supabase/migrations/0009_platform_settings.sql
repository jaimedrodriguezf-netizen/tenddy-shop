-- ==========================================================
-- TENDDY-SHOP: Platform Global Configuration Settings
-- ==========================================================

CREATE TABLE IF NOT EXISTS platform_settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Solo lectura y modificación con service_role / superadmin
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny anon on platform_settings" ON platform_settings FOR ALL USING (FALSE);

-- Guardar credenciales de Telegram para que toda la plataforma las use sin depender solo de variables de entorno
INSERT INTO platform_settings (key, value, description)
VALUES 
    ('telegram_bot_token', '8517142495:AAEYpKgmJTGpjHQb5DHxs46PYpMJdP7h1NM', 'Token oficial del bot @tenddybot en Telegram'),
    ('telegram_chat_id', '', 'ID del chat o grupo donde llegarán las fotos y tickets')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
