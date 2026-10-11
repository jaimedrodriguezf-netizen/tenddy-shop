# Tareas ODD: Optimización y Operaciones por Lote en Módulo de Productos

## Contexto
Mejoras de rendimiento, escalabilidad y seguridad en productos y carga masiva:
1. Soporte de operaciones por lote nativas en `src/app/api/admin/products/route.ts` (eliminación y destacado por lote en 1 sola consulta SQL).
2. Rate limiting en creación de productos y validación de Magic Bytes en subidas de fotos en `POST` y `PATCH`.
3. Optimización de carga masiva en `src/app/api/admin/products/bulk/route.ts`: creación de categorías en 1 lote y actualizaciones concurrentes en paralelo (chunks de 25 con `Promise.all`).
4. Conexión de acciones por lote en `ProductsManagerView.tsx` y saneamiento de descargas de plantillas en `ProductsManagerView.tsx` y `BulkImportModal.tsx`.

## Tareas

- [x] **Tarea 1**: Habilitar operaciones por lote (`DELETE` y `PATCH`), rate limiting y Magic Bytes en `src/app/api/admin/products/route.ts`.
- [x] **Tarea 2**: Optimizar creación de categorías en lote y paralelizar actualizaciones concurrentes en `src/app/api/admin/products/bulk/route.ts`.
- [x] **Tarea 3**: Conectar acciones por lote instantáneas en `ProductsManagerView.tsx` y sanear descargas de plantillas.
- [x] **Tarea 4**: Verificar compilación y build, ejecutar revisión RDD, bump a v1.0.103 y merge a `main`. (Commit: `41ee629`, RDD `review-bb0f264bd40c3d8c` burned).
