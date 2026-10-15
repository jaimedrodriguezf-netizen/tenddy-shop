# Tareas ODD: Landing Page Personalizada de AYME INDUSTRIAS PET (Modelo Aprobado & Valdisplast)

## Contexto y Alcance
Implementación de la landing page personalizada para AYME INDUSTRIAS PET (`ayme-pet`) en Next.js, portando de forma idéntica y nativa el diseño oficial aprobado de `standalone.html` con las siguientes características:
1. **Colores Corporativos**: Color primario Rojo (`#A61C2E`) y secundario Rojo (`#8C1625` / `#A61C2E`) extraídos de la marca, aplicados en Supabase, panel y componentes.
2. **Hero Interactivo con Secuencia de Scroll**:
   - Track pegajoso (`scroll-sequence-track` de 320vh con `scroll-sequence-sticky`).
   - Video de fondo continuo de planta en alta resolución (`/process-video.mp4` / `/assets/process-video.mp4`).
   - Viñeta oscura radial y HUD superior (`MONITOREO DE LÍNEA EN TIEMPO REAL • 40 BAR`).
   - Tarjetas flotantes sincronizadas que se deslizan al scrollear:
     - **Fase 0 (Intro)**: *TECNOLOGÍA EN soplado & inyección* (con botones a catálogo y WhatsApp).
     - **Fase 1**: *Inyección & Calentamiento Infrarrojo de Precisión* (infrarrojo modular y cuello PCO).
     - **Fase 2**: *Soplado Rotativo a 40 Bar & Enfriamiento Criogénico* (bi-orientación y enfriamiento).
   - Barra lateral HUD de progreso vertical y HUD inferior con telemetría en vivo (`FR-0001..0144` y porcentaje sincronizado).
3. **Navegación & Dropdown de Categorías**:
   - Header oficial con acceso a Inicio, dropdown "Catálogo de Envases", Servicios Industriales y Contacto.
4. **Catálogo Conectado a Supabase**:
   - Buscador en vivo por capacidad, boca o nombre.
   - Tarjetas técnicas con empaque (fardos), rosca PCO, botón de cotización por WhatsApp y enlace a `/producto/[slug]`.
5. **3 Servicios Industriales de Planta**:
   - Soplado & Inyección, Tapas & Accesorios, y Matricería 3D de Moldes con cotización directa.
6. **Sección de Contacto & Google Maps**:
   - Formulario de cotización B2B, datos físicos de planta en Llano Grande, Quito, y mapa interactivo.

## Tareas

- [x] **Tarea 1**: Actualizar configuración de colores en Supabase y panel para AYME (Primario Rojo `#A61C2E`, Secundario Rojo `#8C1625`).
- [x] **Tarea 2**: Rediseñar Hero en `TenantLandingView.tsx` (layout 2 columnas, textos a la izquierda y visual frame con video y badges).
- [x] **Tarea 3**: Implementar dropdown de categorías en Header y navegación rápida tipo Valdisplast.
- [x] **Tarea 4**: Implementar bloque de 3 Servicios Industriales de planta con diseño B2B.
- [x] **Tarea 5**: Mejorar tarjetas del catálogo con especificaciones técnicas visibles y botón de cotización WhatsApp con mensaje pre-rellenado.
- [x] **Tarea 6**: Integrar sección de Contacto B2B de planta con formulario, datos y Google Maps funcional.
- [x] **Tarea 7**: Crear tests automatizados, verificar compilación (`tsc`, `lint`, `next build`) y registrar evidencias ODD.
- [x] **Tarea 8**: Implementar motor reactivo de Secuencia de Scroll (3 fases deslizables, HUD superior, timeline vertical y telemetría de frames en tiempo real).
- [x] **Tarea 9**: Verificar renderizado idéntico a standalone.html en Next.js, tests de scroll sequence y compilación de producción.

## Evidencia de Verificación
- **Secuencia de Scroll en React**:
  - Implementado hook reactivo a 60fps con cálculo continuo `lerp` de posición sobre `scroll-sequence-track`.
  - Transición fluida de opacidad y `translateY` en las tarjetas de Fase 0 (Intro), Fase 1 (Control Térmico) y Fase 2 (Soplado Rotativo).
  - Telemetría en vivo en HUD: contador de frames `FR-0001` a `FR-0144`, porcentaje exacto y timeline bar.
- **Hoja de Estilos Oficial**:
  - `src/app/globals.css` importa `@import "../../public/css/style.css";` garantizando tipografías, variables `:root`, gradientes y glassmorphism idénticos al diseño aprobado.
- **Base de Datos & Panel**:
  - `theme_config` de `ayme-pet` actualizado en Supabase con `primary_color: '#A61C2E'`, `secondary_color: '#A61C2E'` y `accent_color: '#A61C2E'`.
- **Catálogo, Buscador & WhatsApp**:
  - Buscador reactivo por capacidad o boca.
  - Tarjetas con datos de fardo y rosca PCO, botón para cotizar por WhatsApp con mensaje pre-rellenado y enlace a la página de producto.
- **Contacto & Google Maps**:
  - Formulario B2B y mapa interactivo de Google Maps de la planta en Llano Grande, Quito.
- **Tests Automatizados**:
  - Suites ejecutadas con 100% de éxito: `tests/ayme-valdisplast-landing.test.js`, `tests/landing-bg-color.test.js`, `tests/logo-color-extractor.test.js`, `tests/logo-uploader.test.js` y `tests/logo-height-slider.test.js`.
- **Compilación & Build**:
  - `npx tsc --noEmit`: 0 errores.
  - ESLint: 0 errores.
  - `next build`: 35 rutas compiladas exitosamente. Versión v1.0.122.
- **RDD**: Revisión aprobada y recibo quemado (`review-4ede50a8828ffa8e`).
- **Commit**: `32cac60` en rama `main` enviado a `origin/main`.
