-- Migración 0013: Ampliar límites de caracteres en productos y categorías
-- Resuelve error "value too long for type character varying(255)" en importaciones masivas de prendas y descripciones técnicas

ALTER TABLE public.products ALTER COLUMN name TYPE text;
ALTER TABLE public.products ALTER COLUMN sku TYPE text;
ALTER TABLE public.products ALTER COLUMN slug TYPE text;

ALTER TABLE public.categories ALTER COLUMN name TYPE text;
ALTER TABLE public.categories ALTER COLUMN slug TYPE text;
