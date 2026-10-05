# Feature: Corrección Integral de Bugs en Catálogo, Carrito y Panel Admin

Estado: Completado y Verificado
Fecha: 2026-10-04
Branch: fix/catalog-and-cart-bugs
Commit: a6b7bd0

## 1. Autorización & Alcance
- **Objetivo**: Subsanar de forma atómica y sistemática los 6 bugs identificados en linter, detalle de producto, apertura de cotizador, ruptura visual de landing, desincronización de paginación en backoffice y soporte de variantes en carrito.
- **Alcance**:
  - Tarea 1: Corregir error bloqueante de ESLint (`react-hooks/set-state-in-effect`) en `src/components/TenantCatalogView.tsx`.
  - Tarea 2: Integrar `CartDrawer` en `ProductDetailView` y ruta `/store/[shopSlug]/producto/[productSlug]` para que el cotizador abra siempre al agregar o pulsar el carrito.
  - Tarea 3: Reparar layout de `TenantLandingView` y envoltura modal de `ProductDetailModal` para no romper la landing oscura.
  - Tarea 4: Corregir desincronización de paginación en `AdminDashboardView` al filtrar por búsqueda o categoría.
  - Tarea 5: Soporte de variantes múltiples en `useCartStore` y unificación de `units_per_package` por defecto.
  - Tarea 6: Optimizar navegación en `/store/[shopSlug]/producto/[productSlug]` con cliente directo y verificación de build.

## 2. Tareas & Evidencia de Implementación

### Tarea 1: Corregir error de linter en TenantCatalogView
- [x] Eliminar `setState` sincrónico dentro de `useEffect` en `TenantCatalogView.tsx` y resetear `visibleCount` limpiamente.
- [x] Verificar `npm run lint` sin errores.
- **Evidencia**: Se implementó ajuste de estado directo durante el ciclo de renderizado eliminando la cascada. `npm run lint` pasó de fallar a 0 errores (código de salida 0).

### Tarea 2: Integrar CartDrawer en ProductDetailView y página directa
- [x] Incorporar `CartDrawer` funcional y selector de sucursal en `ProductDetailView.tsx`.
- [x] Asegurar que en `/store/[shopSlug]/producto/[productSlug]` el cotizador abra y procese pedidos normalmente.
- **Evidencia**: `ProductDetailView.tsx` ahora monta y gestiona internamente `CartDrawer` con estado reactivo de sucursal (`currentBranch`). Tanto al agregar al cotizador como al presionar el botón de carrito superior, el drawer abre y opera fluidamente.

### Tarea 3: Reparar envoltura de producto en TenantLandingView
- [x] Asegurar que la apertura de ficha de producto desde la landing mantenga envoltura modal flotante o vista exclusiva sin quebrar el layout de la landing.
- **Evidencia**: Se envolvió `ProductDetailModal` en un contenedor `fixed inset-0 z-50 overflow-y-auto` con backdrop blur, pasando `branches={branches}`. Al abrir un producto en la landing, se superpone como vista completa sin distorsionar el DOM ni los estilos oscuros de la landing page.

### Tarea 4: Sincronizar paginación en AdminDashboardView
- [x] Resetear `productsPage` a 1 cuando cambie `productSearch` o `productCategoryFilter`, y clampear con `Math.min(productsPage, totalPages)`.
- **Evidencia**: Se introdujo ajuste de renderizado seguro con `prevProductFilters` para volver a la página 1 en cualquier búsqueda o filtro, y `safePage` protege el cálculo de slice e indicadores numéricos contra índices fuera de rango.

### Tarea 5: Soporte de variantes múltiples en carrito y unificación de packSize
- [x] Permitir que `useCartStore` almacene múltiples ítems del mismo producto si tienen variantes/colores distintos.
- [x] Unificar el `units_per_package` por defecto para evitar discrepancias entre vista y cotizador.
- **Evidencia**: Se introdujo discriminación de claves por producto y variante (`product.id__variant`) en `cart.ts`. Ahora los clientes pueden cotizar múltiples tallas/colores de la misma prenda sin sobrescribir ítems previos. Además, `packSize` quedó alineado con fallback de 100 y `CartDrawer` expone visualmente el badge de la variante seleccionada.

### Tarea 6: Optimización de navegación y verificación integral
- [x] Reemplazar Server Action en `onBack` de la página de producto por navegación fluida client-side.
- [x] Ejecutar `tsc --noEmit`, `npm run lint` y `npm run build` confirmando 100% verde.
- **Evidencia**: Se implementó `backHref` con `<Link>` optimizado en `ProductDetailView.tsx`. Las verificaciones estáticas (`tsc --noEmit`), de estilo (`npm run lint`: 0 errores) y compilación de producción (`npm run build`: 28 rutas estáticas y dinámicas) pasaron exitosamente.
