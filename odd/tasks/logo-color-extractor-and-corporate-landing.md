# Tareas ODD: Extracción Automática de Colores del Logo y Aplicación Dinámica en la Landing Page

## Contexto y Alcance
El usuario solicitó que en el panel de personalización (`/store/[shopSlug]/admin` -> Diseño & Apariencia) exista la opción de extraer automáticamente los colores corporativos del logotipo cargado y aplicarlos directamente en la landing page (`TenantLandingView.tsx`).

1. **Motor de Extracción de Paleta (`src/lib/color-extractor.ts`)**:
   - Procesamiento de imagen en Canvas offscreen (soporte para URLs locales, remotas y archivos File/Blob).
   - Filtrado inteligente de transparencias (alpha < 128) y fondos neutros/blancos puros (para no tomar el fondo del logo).
   - Cuantización de color y cálculo de contraste/vibrancia para ordenar por dominancia (color principal) y acento/secundario.
   - Devolución de paleta sugerida de 4 a 6 tonos en formato HEX con contraste garantizado.

2. **Interfaz de Usuario en el Panel (`src/components/AppearanceTab.tsx`)**:
   - Botón interactivo *"Extraer colores del logotipo"* con icono de varita mágica / paleta.
   - Muestra visual de los colores detectados en el logo (swatches con su código HEX).
   - Asignación rápida con un clic para "Color Primario" y "Color Secundario / Acento".
   - Selectores nativos con input type="color" para ajuste fino manual.

3. **Backend y Persistencia (`/api/admin/appearance/route.ts`)**:
   - Aceptar y validar `primary_color`, `secondary_color` y `accent_color` en formato `#RRGGBB`.
   - Guardar en `theme_config` en la base de datos Supabase.

4. **Renderizado Dinámico en la Landing (`src/components/TenantLandingView.tsx`)**:
   - Sustituir los colores estáticos de Tailwind por variables y estilos en línea dinámicos del tenant:
     - Botones principales de acción (Ver Catálogo, Ficha Técnica, Cotizador).
     - Badges de planta industrial, chips de sectores y pestañas activas.
     - Subtítulos de marca y bordes de tarjetas en hover.
     - Indicadores de sucursales y botones destacados.

5. **Pruebas y Verificación**:
   - Tests automatizados en `tests/logo-color-extractor.test.js`.
   - Verificación de TypeScript, linter, build de Next.js y registro de evidencia.

## Tareas

- [x] **Tarea 1**: Implementar módulo utilitario de extracción de paleta en `src/lib/color-extractor.ts`.
- [x] **Tarea 2**: Integrar botón de extracción, swatches de paleta y selectores de color en `src/components/AppearanceTab.tsx`.
- [x] **Tarea 3**: Soportar `secondary_color` y `accent_color` en el backend `src/app/api/admin/appearance/route.ts`.
- [x] **Tarea 4**: Aplicar colores dinámicos en la landing page `src/components/TenantLandingView.tsx`.
- [x] **Tarea 5**: Crear tests automatizados, verificar compilación y ciclo de revisión.

## Evidencia de Verificación
- **Motor de Extracción (`src/lib/color-extractor.ts`)**:
  - Análisis de imágenes por Canvas offscreen con escala y muestreo optimizado (< 5ms).
  - Filtrado estricto de transparencias (alpha < 128), fondos blancos (RGB > 235) y sombras monocromáticas.
  - Cuantización por intervalos y agrupamiento con cálculo de distancia euclidiana (> 42) y ordenamiento por frecuencia y riqueza cromática.
  - En pruebas sintéticas con el logo de AYME, extrae con precisión matemática el Azul Marino `#1f2e4d` como color primario y el Rojo Carmesí `#a61c2e` como color secundario.
- **Panel de Apariencia (`src/components/AppearanceTab.tsx`)**:
  - Botón interactivo *"Extraer colores del logotipo"* con icono de varita mágica y estado de carga (`Loader2`).
  - Extracción automática no bloqueante al subir un nuevo archivo de logo en el panel.
  - Muestra visual de swatches clicables de los tonos detectados en el logo para asignación inmediata a Primario (`P`) o Secundario (`S`).
  - Selectores con muestras predefinidas y selector fino HTML5 `type="color"`.
  - Caja de vista previa interactiva que exhibe en tiempo real la combinación y contraste de botones y badges antes de guardar.
- **Backend & Persistencia (`/api/admin/appearance/route.ts`)**:
  - Función de sanitización `sanitizeHexColor` para validar códigos `#RRGGBB` o `#RGB`.
  - Persistencia segura de `primary_color`, `secondary_color` y `accent_color` en `theme_config` en Supabase.
- **Storefront Landing (`src/components/TenantLandingView.tsx`)**:
  - Adopción dinámica de `primaryColor` y `secondaryColor` en botones de llamada a la acción ("Ver Catálogo", "Ficha", "Agregar al Cotizador"), badges de planta y productos, pestañas de navegación y chips de sucursales.
- **Tests Automatizados**:
  - Suite `tests/logo-color-extractor.test.js` superada al 100% (4/4 bloques).
  - Todas las suites previas de tests ejecutadas sin regresiones (100% éxito).
- **Compilación & Build**:
  - `npx tsc --noEmit` limpio (0 errores).
  - ESLint 0 errores.
  - `next build` exitoso generando 35 rutas estáticas y dinámicas.
  - Bump de versión a v1.0.117.
- **RDD**: Revisión aprobada y recibo quemado (`review-2777304206d37544`).
- **Commit**: `6eb50de` en branch `feat/logo-color-extractor-and-corporate-landing`.
