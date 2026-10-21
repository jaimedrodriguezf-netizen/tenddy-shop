# Barra Lateral y Métricas de Productos e Imágenes para Superadmin
Modernización de la Torre de Control de Superadmin con barra lateral de navegación (Sidebar desktop + drawer móvil) y métricas precisas de productos subidos e imágenes en catálogo y storage.

## Specs
- S1: "3l panel super admin tambien hazle barrala lateral". Transformar la navegación horizontal de `SuperadminDashboardView.tsx` en una barra lateral moderna fija (Sidebar) en desktop con drawer deslizable en móvil, integrando accesos directos a las 3 secciones (Fábricas & Tiendas, Usuarios & Cuentas B2B, Mesa de Ayuda), estado de la sesión, badge de versión y cierre de sesión.
- S2: "y quiero saber el nunero de productos que han subido y el numero de imagenes tambien". En `src/app/superadmin/page.tsx`, extraer el volumen exacto de productos e imágenes (`products.images` y bucket `support-attachments`), calculando métricas globales y por tienda.
- S3: Exhibir en `SuperadminDashboardView.tsx` tarjetas métricas dedicadas para **Total de Productos Subidos** y **Total de Imágenes en Catálogo**, e incorporar en la tabla de tenants el desglose de productos y fotos por empresa.

## Tasks
- [x] T1 (S2): Actualizar la consulta y agregación en `src/app/superadmin/page.tsx` para computar `totalGlobalProducts`, `totalGlobalImages` e incorporar `total_images` en `tenantsSummary`.
- [x] T2 (S1, S3): Rediseñar `src/components/SuperadminDashboardView.tsx` con arquitectura de Barra Lateral (Sidebar desktop + drawer móvil) y tarjetas métricas de Productos e Imágenes.
- [x] T3: Crear suite de pruebas automatizadas `tests/superadmin-sidebar-metrics.test.js` y verificar compilación y funcionamiento sin regresiones.

## Evidencia de Verificación
- **Métricas en Tiempo Real**: 85 productos totales activos y 193 imágenes de producto extraídas desde Supabase.
- **Barra Lateral Desktop & Móvil**: Sidebar oscuro elegante (`w-64/w-72 bg-slate-950`) con marca, navegación a las 3 secciones principales, widget de volumen de plataforma, VersionBadge y botón de cierre de sesión; drawer responsivo en pantallas móviles.
- **Dashboard Grid**: 6 tarjetas métricas destacadas que incluyen Visitas, Productos, Imágenes, Fábricas, Cotizaciones y Cuentas B2B.
- **Tabla de Tiendas**: Columna "Catálogo & Media" que reporta productos e imágenes por cada fábrica registrada.
- **Tests Automatizados**: `tests/superadmin-sidebar-metrics.test.js` ejecutado al 100% exitosamente con compilación Next.js limpia.

## Log
- L1: Solicitud del usuario: "3l panel super admin tambien hazle barrala lateral, y quiero saber el nunero de productos que han subido y el numero de imagenes tambien".
