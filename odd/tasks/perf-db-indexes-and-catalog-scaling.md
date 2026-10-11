# Tareas ODD: Índices de Rendimiento en PostgreSQL y Escalabilidad del Catálogo

## Contexto
Mejoras de rendimiento y escalabilidad de base de datos y renderizado frontend:
1. Migración `0018_performance_indexes.sql`: Índices compuestos para catálogo activo (`tenant_id, is_active, created_at DESC`), búsqueda rápida por SKU (`tenant_id, sku`) y cotizaciones (`tenant_id, created_at DESC`).
2. Optimización O(1) de filtrado de categorías y descendientes en `TenantCatalogView.tsx` evitando llamadas recursivas por cada producto.
3. Saneamiento de efectos y entidades en `ReviewsManagerView.tsx` para React 19 / ESLint 9 (0 errores).

## Tareas

- [x] **Tarea 1**: Crear migración `supabase/migrations/0018_performance_indexes.sql` sincronizada con la base de datos.
- [x] **Tarea 2**: Optimizar el filtrado de productos en `TenantCatalogView.tsx` extrayendo el conjunto de categorías descendientes con `useMemo` a un `Set` O(1).
- [x] **Tarea 3**: Corregir efecto de carga y entidades no escapadas en `ReviewsManagerView.tsx` para limpiar los errores de ESLint.
- [x] **Tarea 4**: Verificar compilación y build, ejecutar revisión RDD, bump a v1.0.102 y merge a `main`. (Commit: `f23218f`, RDD `review-8f1792643552c6b2` burned).
