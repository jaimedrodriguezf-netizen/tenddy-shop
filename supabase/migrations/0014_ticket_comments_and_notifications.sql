-- Migración 0014: Hilos de discusión estilo GitHub Issues y Notificaciones de Soporte

-- 1. Tabla de comentarios y respuestas en tickets
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(32) NOT NULL DEFAULT 'tenant', -- 'tenant' | 'support' | 'system'
  sender_name VARCHAR(128) NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas rápidas por ticket
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON public.ticket_comments(created_at ASC);

-- 2. Columnas en support_tickets para notificaciones y explicación de solución
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS unread_tenant_count INTEGER DEFAULT 0;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS resolution_summary TEXT;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS fixed_in_version VARCHAR(32);
