# Tareas ODD: Eliminación de Iframe Hardcodeado y Navegación Nativa a Páginas de Producto

## Contexto y Alcance
Eliminación del iframe estático hardcodeado para `ayme-pet` y `plastpet` en `src/app/store/[shopSlug]/page.tsx`:
1. **Unificación de Arquitectura**: Quitar la excepción del iframe para que todas las tiendas operen de forma nativa en Server Components (`TenantLandingView` o `TenantCatalogView`).
2. **Cero Modales al explorar productos**: Reemplazar la apertura de `ProductDetailModal` en `TenantLandingView.tsx` y `TenantCatalogView.tsx` por enlaces `<Link>` a la página completa de producto `/store/[shopSlug]/producto/[productSlug]` con su URL canónica y la interfaz Marketplace completa.
3. **Validación y Verificación**: Comprobación con tests automatizados y Puppeteer, `tsc`, `lint`, `build` y auditoría RDD.

## Tareas

- [x] **Tarea 1**: Eliminar iframe hardcodeado de `ayme-pet` y `plastpet` en `page.tsx`.
- [x] **Tarea 2**: Reemplazar modales en `TenantLandingView` y `TenantCatalogView` por enlaces directos a `/producto/[slug]`.
- [x] **Tarea 3**: Verificar compilación, linter, tests E2E y registrar evidencias ODD.

## Evidencia de Verificación
- **Fin del Iframe**: Se eliminó la condición forzada `if (tenant.slug === 'ayme-pet' || tenant.slug === 'plastpet')` en `src/app/store/[shopSlug]/page.tsx`. AYME PET corre ahora 100% nativa en Next.js Server Components.
- **Cero Modales**: En `TenantLandingView.tsx` y `TenantCatalogView.tsx`, se retiró la apertura de modales (`ProductDetailModal`). Todos los clics en fotos, títulos y fichas técnicas navegan con `<Link>` a la URL propia `/store/ayme-pet/producto/[slug]`.
- **Experiencia Marketplace**: Al entrar a cualquier producto, se despliega a pantalla completa la interfaz Marketplace (breadcrumb jerárquico, precio $3.14 con 47% de descuento, temporizador de temporada en vivo, transportistas oficiales FAR International / LAARCOURIER / URBANO, garantías y muro de reseñas verificadas).
- **Pruebas Automatizadas con Puppeteer**: Navegación de extremo a extremo comprobada con éxito: de `/store/ayme-pet` navega directamente a `/store/ayme-pet/producto/[slug]` sin iframe y sin modal.
- **Compilación y Build**: 0 errores en TypeScript, 0 errores en ESLint, Next.js build exitoso en 35 rutas. Versionado a v1.0.109.
- **RDD**: Revisión aprobada y recibo quemado (`review-f8e980a932832950`).
- **Commit**: `30810d8` en branch `feat/remove-hardcoded-iframe-and-native-pdp-navigation`.
