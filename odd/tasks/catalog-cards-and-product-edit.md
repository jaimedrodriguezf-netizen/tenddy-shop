# Feature: Catalog Product Cards Dual-View & Enhanced Product Editor

Estado: Completado y Verificado
Fecha: 2026-10-03
Branch: main

## 1. Autorización & Alcance
- **Objetivo**: Habilitar edición completa de productos (nombre, subida de foto local, pegado por Ctrl+V y enlace URL con normalización de Google Drive) e implementar visualización dual (vertical y horizontal) del catálogo mostrando código, colores, tallas y el logo de la empresa.
- **Origen**: Tickets de soporte #8309 (Tarjetas vertical y horizontal con código, colores, tallas y logo), #9072 (Modificar nombre y volver a subir foto), #8383 (Subir foto) y #8285 (Consistencia de formato).
- **Alcance**:
  - Backend `src/app/api/admin/products/route.ts`:
    - Soportar `image_url` directa y `imageData` en `PATCH` y `POST`.
    - Regenerar slug si cambia el nombre o SKU.
  - Frontend `src/components/EditProductModal.tsx`:
    - Entrada de URL de imagen con auto-conversión de Google Drive.
    - Soporte multi-método para fotos: subir archivo, pegar con Ctrl+V, o ingresar URL.
    - Botón para retirar foto y previsualización en vivo.
  - Frontend `src/components/CreateProductModal.tsx`:
    - Agregar campo de URL de imagen alternativa al upload local.
  - Frontend `src/components/AdminDashboardView.tsx`:
    - Selector de vista dual: **Cuadrícula Vertical** (aspect [3/4]) y **Fila Horizontal**.
    - Integrar logo oficial de la empresa en la esquina de la foto.
    - Mostrar prominentemente Código SKU, badges de Colores y Tallas.

## 2. Tareas & Evidencia de Implementación

### Tarea 1: Backend PATCH soporte de imagen y slug
- [x] Aceptar `image_url` y `imageData` en `PATCH` y `POST` `/api/admin/products`.
- [x] Actualizar slug si name o sku cambian.
- **Evidencia**: `src/app/api/admin/products/route.ts` actualizado con soporte dual de imagen y normalización de slug.

### Tarea 2: Modal de edición de producto enriquecido (`EditProductModal.tsx`)
- [x] Agregar campo de URL directa con auto-conversión de enlaces de Google Drive a URLs web directas.
- [x] Permitir retirar foto actual o sustituirla con carga local / pegado del portapapeles.
- **Evidencia**: `EditProductModal.tsx` testeado y verificado.

### Tarea 3: Modal de creación con soporte de URL directa (`CreateProductModal.tsx`)
- [x] Campo para URL directa integrado con normalización de Google Drive y preview reactivo.
- **Evidencia**: `CreateProductModal.tsx` testeado y verificado.

### Tarea 4: Visualización dual Vertical / Horizontal en catálogo del admin (`AdminDashboardView.tsx`)
- [x] Selector con botones `LayoutGrid` (Vertical) y `List` (Horizontal).
- [x] Logo de la empresa en la esquina superior de la foto en ambas vistas.
- [x] Badge de Código SKU destacado, badges de colores 🎨 y tallas 📏.
- **Evidencia**: Cumple con tickets #8309 y #8285.

### Tarea 5: Verificación visual, TypeScript y Build
- [x] Chequeo estricto de tipos (`./node_modules/.bin/tsc --noEmit`): 0 errores.
- [x] Linter (`npm run lint`): 0 errores.
- [x] Build de producción (`npm run build`): Compilado en verde en 6.1s (26 rutas).
- **Evidencia**: Compilación impecable verificada.
