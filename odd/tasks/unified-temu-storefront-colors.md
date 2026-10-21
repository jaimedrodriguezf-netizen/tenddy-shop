# Modo Estándar Storefront Estilo Temu con Colores Primario y Secundario Unificados
Sistema dinámico de tokens visuales y rediseño de alta conversión estilo Temu para el catálogo estándar en Tenddy Shop.

## Specs
- S1: "el diseño tiene que ser estilo temu" en el modo estándar del storefront (`TenantCatalogView`), incorporando densidad visual limpia, buscador prominente con botón de búsqueda, navegación por píldoras horizontales, tarjetas de producto compactas con badges de demanda y botón de compra/cotización directo.
- S2: "los colores recuerda que se pueden cambiar desde el panel, por eso hay que unificar para que no solo cambie algunos elementos sino todos". Ningún componente del storefront estándar debe tener colores de acento fijos hardcodeados (como `sky-600` o `sky-50`); todos deben derivarse de las propiedades dinámicas del tenant.
- S3: "tomar en cuenta dos colores primario y secundario". Establecer una jerarquía estricta donde el `primary_color` rige las llamadas a la acción principales (CTA "+ Cotizar", píldoras activas, focos de búsqueda, badge de carrito y banners de colección) y el `secondary_color` rige acentos complementarios (etiquetas secundarias, badges de bulto/SKU, barra flotante inferior y banner informativo).
- S4: Unificación visual integral que garantice legibilidad, contraste cromático y accesibilidad en todos los estados interactivos (hover, active, focus, selection).

## Tasks
- [x] T1 (S2, S3): Diseñar e implementar utilidad de tokens de diseño dinámicos para `primary_color` y `secondary_color` con cálculo de contraste y variantes (hover, light, border) para CSS Variables. (Commit: 00de30b)
- [x] T2 (S1, S2, S3, S4): Refactorizar `TenantCatalogView.tsx` eliminando clases estáticas `sky-*` y aplicando el diseño Temu unificado con variables de color en header, buscador y barra de categorías. (Commit: 00de30b)
- [x] T3 (S1, S2, S3, S4): Rediseñar las tarjetas de producto (Product Card) en `TenantCatalogView.tsx` con densidad estilo Temu, badges jerarquizados por color primario/secundario y CTA directo de cotización. (Commit: 00de30b)
- [x] T4 (S1, S2, S3, S4): Escribir tests automatizados que verifiquen la absorción dinámica de colores primario y secundario, ausencia de estilos fijos y renderizado de tokens Temu. (Commit: 00de30b)

## Evidencia de Verificación
- **Tokens Dinámicos (`src/lib/theme-tokens.ts`)**: Genera variables `--tenant-primary` y `--tenant-secondary` con variantes cromáticas (hover, 10% opacity light, 28% opacity border) y contraste perceptual según luminancia ITU-R BT.601 (`#ffffff` o `#0f172a`).
- **Eliminación Total de Clases Fijas**: 100% de clases `sky-*` (29 ocurrencias) purgadas de `TenantCatalogView.tsx`.
- **Diseño Estilo Temu**:
  - Header: Buscador ensanchado con botón de búsqueda integrado gobernado por color primario, y carrito con contador destacado.
  - Categorías: Píldoras con scroll táctil, estado activo gobernado por `primary_color` con elevación y subcategorías armonizadas.
  - Product Cards: Grilla densa (2 cols mobile, 4-5 desktop), badges de volumen/MOQ en `secondary_color`, badges de demanda/estrellas preservados y botón de cotización rápida "+ Cotizar" en `primary_color`.
  - Barra Flotante Inferior: Sincronizada con `secondary_color` de fondo y `primary_color` en botón de acción rápida.
  - Ficha Técnica (`ProductDetailView.tsx`): Sincronizada con los tokens del tenant para consistencia en botones de pedido y carrito.
- **Pruebas Automatizadas**:
  - `tests/unified-temu-storefront-colors.test.js`: 7/7 suites aprobadas (100%).
  - `tests/storefront-hardening.test.js`: 4/4 aprobadas.
  - `tests/whatsapp-and-social.test.js`: 5/5 aprobadas.
  - Toda la suite de regresión ejecutada con éxito.
- **Calidad de Código**: TypeScript limpio (`tsc --noEmit`), ESLint con 0 errores (`npm run lint`), compilación de producción exitosa (`next build`, 35 rutas). Bump de versión a `v0.1.10`.

## Log
- L1: Solicitud inicial: "hola, vamos a analizar el modo estandar de la landing page vamos a enforcarnos en el diseño, haz el analisis elndiseño tieke que ser esrilo temu haganos la planificacion losncolores tieen que estar unificaos, tu dsme recomendaciones para elndiseñobeste unificado".
- L2: Aprobación y directriz de colores: "ok dale, pero los color3s recuerda que se pueden cambiar desde elnpanel, por eso haybque unificar para que no solo cambie algunos elemento sino todos y tomar encuenta dos colores primsrio y secundsrio".
