# Tareas ODD: Selector de Color de Fondo de la Landing Page en Panel y Renderizado Dinámico

## Contexto y Alcance
El usuario seleccionó incorporar un control en el panel administrativo (`AppearanceTab.tsx`) para calibrar libremente el color de fondo de la landing page (`TenantLandingView.tsx`), permitiendo alternar entre atmósfera oscura corporativa (ej: Azul Marino profundo `#0b1329`), fondos claros institucionales (`#f8fafc`) o fondos personalizados con selector HEX.

1. **Panel de Diseño (`src/components/AppearanceTab.tsx`)**:
   - Añadir selector para "Color de Fondo de la Landing Page" (`landingBgColor`).
   - Muestras rápidas: Tinte Marino Oscuro (`#0a1128`), Oscuro Pizarra (`#020617`), Blanco Institucional (`#f8fafc`) y Negro Carbón (`#121212`).
   - Selector fino con `input type="color"`.
   - Botón *"Teñir fondo con el color del logo"* que deriva un fondo ambiental armónico a partir del color primario.
   - Envío de `landing_bg_color` en la petición PATCH `/api/admin/appearance`.

2. **Backend & Persistencia (`/api/admin/appearance/route.ts`)**:
   - Sanitizar y validar `landing_bg_color` con `sanitizeHexColor`.
   - Guardar en `theme_config.landing_bg_color`.

3. **Storefront Landing (`src/components/TenantLandingView.tsx`)**:
   - Consumir `landingBgColor = theme?.landing_bg_color || '#020617'`.
   - Calcular luminancia para contraste automático de textos (claro vs oscuro).
   - Aplicar el color de fondo dinámico y gradientes armónicos en el canvas general, Hero, secciones y footer.

4. **Tests & Verificación**:
   - Tests en `tests/landing-bg-color.test.js`.
   - Verificación de TypeScript, ESLint, Next.js build y ciclo RDD.

## Tareas

- [x] **Tarea 1**: Soportar `landing_bg_color` en backend `/api/admin/appearance/route.ts`.
- [x] **Tarea 2**: Integrar selector de color de fondo en `src/components/AppearanceTab.tsx`.
- [x] **Tarea 3**: Aplicar color de fondo y contraste adaptativo en `src/components/TenantLandingView.tsx`.
- [x] **Tarea 4**: Crear tests automatizados, verificar compilación y ciclo de revisión.

## Evidencia de Verificación
- **Backend (`/api/admin/appearance/route.ts`)**:
  - Parámetro `landing_bg_color` recibido y validado con `sanitizeHexColor`.
  - Persistencia en `theme_config.landing_bg_color`.
- **Panel de Apariencia (`src/components/AppearanceTab.tsx`)**:
  - Selector libre de color de fondo con indicador HEX y selector fino HTML5 `type="color"`.
  - Presets rápidos: Azul Marino Profundo AYME (`#0a1128`), Oscuro Pizarra (`#020617`), Gris Carbón Industrial (`#111827`) y Blanco Institucional (`#f8fafc`).
  - Botón inteligente *"Teñir con logo"* que calcula un fondo ambiental armónico oscuro derivado del color primario.
  - Vista previa interactiva de combinación de botones y badges que adopta en vivo el color de fondo seleccionado (`style={{ backgroundColor: landingBgColor }}`).
- **Storefront Landing (`src/components/TenantLandingView.tsx`)**:
  - Lectura de `landingBgColor = (theme as any)?.landing_bg_color || '#020617'`.
  - Cálculo algorítmico de luminancia relativa (`isLightBg`) para adaptar automáticamente el contraste de textos e interfaces (modo claro vs oscuro).
  - Aplicación dinámica en contenedor principal (`min-h-screen`), barra superior, encabezado, gradiente de Hero y pie de página.
- **Tests Automatizados**:
  - Suite `tests/landing-bg-color.test.js` superada al 100% (3/3 bloques).
  - Regresiones verificadas: todas las suites previas ejecutadas con éxito.
- **Compilación & Build**:
  - `npx tsc --noEmit` limpio (0 errores).
  - ESLint 0 errores.
  - `next build` exitoso (35 rutas). Bump a v1.0.120.
- **RDD**: Revisión aprobada y recibo quemado (`review-7897626e2c8f0b4d`).
