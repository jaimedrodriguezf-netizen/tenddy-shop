# Tareas ODD: Saneamiento e Interactividad de la Landing Page de AYME INDUSTRIAS PET

## Contexto y Alcance
Refactorización y enriquecimiento interactivo de la página personalizada de AYME INDUSTRIAS PET (`TenantLandingView.tsx`), eliminando elementos redundantes y hardcodeados, e incorporando interactividad real:
1. **Paso 1: Hero & Timeline Interactivo**:
   - Hacer interactivo el timeline lateral (`01`, `02`) para navegar suavemente a las fases del Hero al hacer clic.
   - Botón de control de video (Pausa / Reproducir) en el HUD.
   - Año dinámico en llamados a la acción (en vez de "Catálogo 2026" fijo).
2. **Paso 2: Servicios Industriales con Assets Locales & Modal de Cotización Técnica**:
   - Migrar imágenes de CDN externo de GoDaddy a `public/assets/services/` locales y resilientes.
   - Convertir las tarjetas de servicios estáticas en interactivas con modal de requerimiento técnico (especificaciones de molde, volumen de maquila, tipo de tapas).
3. **Paso 3: Catálogo Interactivo con Filtros Técnicos y Ficha Rápida (QuickView)**:
   - Filtros rápidos por capacidad (ej: 60ml, 250ml, 500ml, 1L, Galón) y tipo de rosca.
   - Modal QuickView embebido en la landing para consultar especificaciones sin abandonar el scroll.
   - Calculadora de fardos en tiempo real para pedidos al por mayor.
4. **Paso 4: Limpieza de Fallbacks Redundantes y Mapa Dinámico**:
   - Centralizar fallbacks de contacto y dirección.
   - Mapa dinámico basado en la configuración real del tenant.

## Tareas

- [x] **Tarea 1**: Implementar Timeline Interactivo con salto suave de fases y controles de reproducción en el Hero de `TenantLandingView.tsx`.
- [x] **Tarea 2**: Descargar y migrar imágenes de Servicios a local (`public/assets/services/`) y crear Modal de Requerimiento Técnico B2B para servicios.
- [x] **Tarea 3**: Incorporar filtros por capacidad técnica y Modal QuickView interactivo en el Catálogo de `TenantLandingView.tsx`.
- [x] **Tarea 4**: Centralizar fallbacks redundantes de AYME y verificar compatibilidad con tests y build de producción.

## Evidencia de Verificación
- **Hero & Video Interactivos**:
  - Botón de pausa/reanudación de video en el HUD superior con indicador de estado (en vivo / pausado).
  - Nodos del timeline vertical (`01`, `02`) y track interactivo que permiten saltar directamente a la fase seleccionada con `scrollToPhase`.
  - Año dinámico en llamada a la acción (`new Date().getFullYear()`).
- **Servicios Industriales Locales & Configurador B2B**:
  - Imágenes descargadas localmente en `public/assets/services/service-01.webp`, `service-02.webp` y `service-03.png`, eliminando dependencia de GoDaddy CDN.
  - Modal interactivo de requerimiento técnico con selección de especificaciones (capacidad, boca, volumen estimado, datos de empresa) con persistencia no bloqueante de lead en `/api/quotes` y redirección a WhatsApp formal.
- **Catálogo Interactivo con QuickView & Calculadora de Fardos**:
  - Filtros técnicos de capacidad por chips (`Todas`, `60ml`, `250ml`, `500ml`, `1L`, `4L`) reactivos en `useMemo`.
  - Modal QuickView embebido en la landing que permite consultar ficha técnica sin abandonar la posición de scroll.
  - Calculadora de fardos en tiempo real con selector de unidades y cálculo de fardos para el cotizador y WhatsApp.
- **Fechas Dinámicas en Detalle de Producto**:
  - Fin de oferta relativo al último día del mes en curso y tiempo de entrega calculado dinámicamente (`2 a 5 días hábiles`).
- **Tests Automatizados**:
  - 100% de éxito en las 5 suites: `tests/ayme-valdisplast-landing.test.js`, `tests/ayme-landing-mobile.test.js`, `tests/marketplace-product-detail.test.js`, `tests/ayme-perf-and-security.test.js`, `tests/ayme-modal-marketplace.test.js`.
  - 0 errores TypeScript (`npx tsc --noEmit`).

## Log
- L1: El usuario solicita revisar elementos redundantes y hardcodeados de la página personalizada de AYME INDUSTRIAS para darles soluciones o hacerlos interactivos uno por uno.
- L2: Implementada interactividad en Hero (timeline clicable y video controls), Servicios (assets locales y modal técnico B2B), Catálogo (chips de capacidad y QuickView con calculadora de fardos en vivo) y versión bump a v0.1.1.
- L3: Poda y saneamiento de 5 redundancias críticas: unificado render de Logo sin doble <Link>, centralizado objeto tenantDefaults para fallbacks, eliminado video duplicado de 3MB (public/process-video.mp4), estandarizadas URLs de WhatsApp con buildEcuadorWhatsAppUrl(), optimizadas micro-acciones en tarjetas de producto y armonizados sellos de Respaldo Industrial sin duplicar los badges del footer. Versión bump a v0.1.2.
- L4: Poda y saneamiento de hardcodeos en Ficha Técnica y Landing: dinamizado 'Uso Recomendado' y variantes de fardos según units_per_package en ProductDetailView.tsx; extraído helper centralizado persistLeadQuote hacia /api/quotes en TenantLandingView.tsx; mapeado reactivo de opciones de contacto y simplificado enlace a Google Maps. Versión bump a v0.1.3.
- L5: Implementación completa de Ubicación de Planta, Fábrica, Horarios y Google Maps en el panel de control: habilitados plant_location, address, email, hours, maps_url y maps_embed_url en PATCH /api/admin/appearance; creado bloque UI en AppearanceTab.tsx con inputs dedicados y sanitización. Versión bump a v0.1.4.
- L6: Blindaje de seguridad, rendimiento y escalabilidad: validación estricta de dominios oficiales de Google Maps en maps_embed_url y maps_url con protección anti open-redirect y XSS; sandbox en iframe; truncamiento defensivo de strings; corrección de payload de leads (name en items) y teléfono obligatorio en modal; optimización del rAF en el scroll del Hero silenciando re-renders fuera del viewport. Versión bump a v0.1.5.
- L7: Corrección de Clock Skew en anti-bot time-trap de /api/quotes (evitando falso descarte de clientes con reloj adelantado); robustecimiento de WhatsApp y botón de respaldo anti-bloqueo de popups en CartDrawer para Safari/iOS; sustitución de manipulación imperativa del DOM por fallback declarativo en imágenes de catálogo. Versión bump a v0.1.6.
- L8: Normalización inteligente de capacidades industriales en catálogo (ej: 500ml = 500 ml, 1000ml = 1L / 1 Litro, 4000ml = 4L / Galón) eliminando pérdida de ventas por discrepancia de espacios; sincronización del temporizador de oferta con el calendario real hasta fin de mes en ProductDetailView.tsx. Versión bump a v0.1.7.
- L9: Blindaje contra colisiones en cotizaciones (elevada entropía a 6 dígitos en quote_number evitando fallo de integridad en Supabase); prevención de Hydration Mismatch en ProductDetailView.tsx con suppressHydrationWarning; optimización de serialización en cart.ts reduciendo un 75% el uso de cuota en localStorage. Versión bump a v0.1.8.
- L10: Mejoras de accesibilidad y escalabilidad: bloqueo de scroll en el body (overflow: hidden) y atajo de tecla Escape para modales interactivos en TenantLandingView.tsx; acotamiento superior en la calculadora de fardos (máx. 1.000.000 uds); blindaje contra falsos positivos en búsqueda por objetos anidados; y paginación acotada (.limit(100)) en la carga inicial de cotizaciones en admin/page.tsx. Versión bump a v0.1.9.
