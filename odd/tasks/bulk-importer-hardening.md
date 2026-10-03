# Feature: Bulk Product Importer Hardening & 2000+ Items Scaling

Estado: Completado y Verificado
Fecha: 2026-10-03
Branch: main

## 1. Autorización & Alcance
- **Objetivo**: Resolver el error `value too long for type character varying(255)` y escalar la capacidad de importación masiva de productos a más de 2000 artículos concurrentes con imágenes.
- **Origen**: Tickets de soporte #7100 y #5686 (Tenant M&D).
- **Alcance**:
  - Migración en Supabase (`0013_expand_product_and_category_text_limits.sql`): convertir columnas `name`, `sku` y `slug` de `products` y `categories` a `TEXT`.
  - Backend `/api/admin/products/bulk`:
    - Elevar límite máximo a 3000 productos.
    - Implementar inserción en lotes (chunks de 100 productos por transacción) para evitar sobrecarga de payload y timeouts.
    - Sanitización y resguardo de `slug` y strings para evitar desbordes.
  - Frontend `src/components/BulkImportModal.tsx`:
    - Elevar límite en interfaz a 3000 ítems.
    - Barra de progreso por lotes para dar retroalimentación visual al usuario durante cargas pesadas (>1000 productos).
  - Verificación: `npm run build`, `tsc --noEmit`, y test de inserción con nombres de 482 caracteres.

## 2. Tareas & Evidencia de Implementación

### Tarea 1: Migración de base de datos en Supabase
- [x] Crear migración `supabase/migrations/0013_expand_product_and_category_text_limits.sql`.
- [x] Ejecutar el DDL en la base de datos de producción vía Management API.
- [x] Verificar que las columnas en `products` y `categories` admitan texto largo sin límite de 255.
- **Evidencia**: DDL aplicado. `information_schema.columns` confirma `products.name`, `products.sku`, `products.slug`, `categories.name`, `categories.slug` como `text` sin longitud máxima.

### Tarea 2: Escalabilidad y resiliencia en Backend (`/api/admin/products/bulk`)
- [x] Aumentar límite a 3000 productos por solicitud.
- [x] Implementar batching en lotes de 100 registros con acumulación segura y retorno de productos insertados.
- [x] Truncar inteligentemente los slugs para evitar colisiones y desbordes.
- **Evidencia**: Inserción dividida en `CHUNK_SIZE = 100` con manejo de errores granular por lote.

### Tarea 3: Experiencia de Usuario en Frontend (`BulkImportModal.tsx`)
- [x] Ajustar validaciones de cantidad (permitir hasta 3000 productos).
- [x] Mostrar indicador de progreso dinámico (`Importando X productos en lotes...`).
- [x] Actualizar textos informativos de cabecera.
- **Evidencia**: `BulkImportModal.tsx` actualizado y testeado.

### Tarea 4: Verificación y Pruebas
- [x] Compilación TypeScript (`./node_modules/.bin/tsc --noEmit`): 0 errores.
- [x] Linter (`npm run lint`): 0 errores.
- [x] Build de producción (`npm run build`): Compilado en 5.3s, 26 rutas estáticas y dinámicas generadas.
- [x] Prueba funcional en base de datos: Inserción real de un producto con nombre de 482 caracteres aceptada y eliminada con éxito.
- **Evidencia**: Test de script en vivo ejecutado exitosamente.
