# Tareas ODD: Control Deslizante de Tamaño de Logo y Renderizado Dinámico

## Contexto y Alcance
El usuario consideró que el logo a 48px resultaba demasiado grande para su gusto y solicitó poder regular libremente el tamaño mediante una barra deslizante (tipo control de volumen) en el panel de diseño:
1. **Panel (`AppearanceTab.tsx`)**: Agregar control `<input type="range" min="24" max="56" step="2">` con preview que redimensiona el logo en tiempo real e indicador visual de píxeles (`px`).
2. **Backend (`/api/admin/appearance/route.ts`)**: Validar `logo_height` (entre 24 y 64px) y persistir en `theme_config.logo_height` en Supabase.
3. **Storefronts (`TenantLandingView.tsx` y `TenantCatalogView.tsx`)**: Leer `tenant.theme_config?.logo_height || 38` y aplicar el alto exacto sobre el contenedor y la imagen, garantizando cero parpadeos y proporción nítida.
4. **Verificación**: Tests automatizados, `tsc`, `lint`, `build` y ciclo RDD.

## Tareas

- [x] **Tarea 1**: Implementar slider de tamaño de logo y preview interactivo en `AppearanceTab.tsx`.
- [x] **Tarea 2**: Validar y persistir `logo_height` en `theme_config` en `/api/admin/appearance`.
- [x] **Tarea 3**: Aplicar altura dinámica configurable en los headers de `TenantLandingView` y `TenantCatalogView`.
- [x] **Tarea 4**: Verificar con tests automatizados, build, ciclo RDD y enviar a producción.

## Evidencia de Verificación
- **Control Deslizante de Rango (`AppearanceTab.tsx`)**: Slider tipo barra de volumen `<input type="range" min="24" max="56" step="2">` con indicador dinámico de píxeles y vista previa en tiempo real que escala el logo al arrastrar.
- **Backend Persistente (`/api/admin/appearance/route.ts`)**: Validación de límites numéricos (20 a 72 px, default 38) y guardado en `theme_config.logo_height`.
- **Renderizado Dinámico SSR (`TenantLandingView` y `TenantCatalogView`)**: Ambos encabezados leen la altura configurada y la aplican en línea con proporciones fluidas, garantizando nitidez sin distorsión ni saltos de maquetación (CLS = 0).
- **Tests Automatizados**: `tests/logo-height-slider.test.js` superado al 100% (3/3). Todos los tests de suites previas verificados sin regresiones.
- **Compilación**: TypeScript limpio, 0 errores ESLint, `next build` exitoso en 35 rutas. Versionado a v1.0.116.
- **RDD**: Revisión aprobada y recibo quemado (`review-a2d26a9d46600a74`).
- **Commit**: `5568ee3` en branch `feat/logo-height-slider-control`.
