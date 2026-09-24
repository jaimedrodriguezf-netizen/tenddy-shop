-- ==========================================================
-- TENDDY-SHOP: Support Tickets & Image Feedback Engine
-- ==========================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(32) NOT NULL,          -- e.g. "TICK-2026-0001"
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL, -- Si lo envió desde una tienda específica
    
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255),
    sender_phone VARCHAR(50) NOT NULL,
    
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,                              -- Captura de pantalla o foto del problema (Base64 / URL)
    
    category VARCHAR(64) DEFAULT 'technical',   -- "technical", "billing", "catalog", "general"
    status VARCHAR(32) DEFAULT 'open',          -- "open", "in_progress", "resolved", "closed"
    priority VARCHAR(32) DEFAULT 'normal',      -- "low", "normal", "high", "urgent"
    
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Política: lectura solo para service_role / superadmin
CREATE POLICY "Deny anon select on support_tickets" ON support_tickets FOR SELECT USING (FALSE);
CREATE POLICY "Deny anon update or delete on support_tickets" ON support_tickets FOR UPDATE USING (FALSE);

CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
