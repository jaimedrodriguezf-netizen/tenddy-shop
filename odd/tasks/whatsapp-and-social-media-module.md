# Tareas ODD: Módulo de WhatsApp Centralizado (Ecuador 🇪🇨) y Redes Sociales B2B

## Contexto y Alcance
Implementación de un módulo unificado para gestión de WhatsApp con normalización automática para Ecuador (`+593` / `09...`) y redes sociales comerciales (LinkedIn, Facebook, Instagram, TikTok, YouTube):
1. **Normalizador Telefónico de Ecuador (`src/lib/ecuador-phone.ts`)**:
   - Limpieza y validación de números celulares ecuatorianos de 10 dígitos que inician en `09`.
   - Conversión automática a formato internacional `5939...` para enlaces `wa.me/` sin perder el cero en la presentación visual (`09...`).
   - Soporte para líneas fijas con código de provincia (ej: Pichincha `02`, Cuenca `07`, Guayas `04`).
2. **Tipado & Esquema (`src/lib/types.ts`)**:
   - `social_links` en `landing_config` y `theme_config` con `whatsapp_main`, `whatsapp_display`, `whatsapp_urgent`, `whatsapp_welcome_msg`, `linkedin`, `facebook`, `instagram`, `tiktok`, `youtube`, `show_floating_whatsapp`.
3. **Backend & Persistencia (`src/app/api/admin/appearance/route.ts`)**:
   - Recepción, sanitización con `normalizeEcuadorPhone` y persistencia en Supabase.
   - Sincronización automática con `whatsapp_default` y `display_phone` para mantener compatibilidad universal.
4. **Panel Administrativo (`src/components/AppearanceTab.tsx`)**:
   - Módulo visual "Canales de Contacto & Redes Sociales (Ecuador 🇪🇨)".
   - Input con bandera 🇪🇨 y prefijo fijo `+593` con validación en tiempo real.
   - Campo para mensaje de bienvenida predeterminado de cotización.
   - Inputs para redes sociales (LinkedIn, Facebook, Instagram, TikTok, YouTube).
   - Toggle para botón flotante de WhatsApp.
5. **Storefront Landing (`src/components/TenantLandingView.tsx`)**:
   - Todos los botones de cotización y WhatsApp consumen el número normalizado y el mensaje predeterminado.
   - Botón de urgencias consume `whatsapp_urgent`.
   - Iconos de redes sociales en el footer corporativo.
   - Widget flotante de WhatsApp en la esquina inferior.
6. **Tests y Verificación**:
   - Suite de pruebas `tests/whatsapp-and-social.test.js`.
   - TypeScript, ESLint y compilación Next.js.

## Tareas

- [x] **Tarea 1**: Crear módulo utilitario `src/lib/ecuador-phone.ts` con normalización y tests unitarios.
- [x] **Tarea 2**: Actualizar tipado en `src/lib/types.ts` con la estructura `social_links`.
- [x] **Tarea 3**: Soportar `social_links` en backend `src/app/api/admin/appearance/route.ts`.
- [x] **Tarea 4**: Construir módulo UI en `src/components/AppearanceTab.tsx` (bandera 🇪🇨, inputs y redes).
- [x] **Tarea 5**: Integrar WhatsApp centralizado, redes en footer y widget flotante en `TenantLandingView.tsx`.
- [x] **Tarea 6**: Crear tests automatizados, verificar compilación (`tsc`, `lint`, `next build`) y registrar evidencias ODD.

## Evidencia de Verificación
- **Normalización Telefónica (`src/lib/ecuador-phone.ts`)**:
  - `0998722324` -> `international: 593998722324`, `display: 0998722324`.
  - `+593 99 872 2324` -> `593998722324`.
  - Teléfonos fijos (`02 280 3464`) reconocidos con código provincial ecuatoriano.
  - Generador de URLs canónicas `buildEcuadorWhatsAppUrl`.
- **Backend & Sincronización (`src/app/api/admin/appearance/route.ts`)**:
  - Procesamiento, validación y persistencia de `social_links` en `landing_config` y `theme_config`.
  - Sincronización transparente con `whatsapp_default` y `display_phone`.
- **Panel Administrativo (`src/components/AppearanceTab.tsx`)**:
  - Bloque visual "WhatsApp Comercial & Redes Sociales Oficiales (Ecuador 🇪🇨)".
  - Selector con bandera 🇪🇨, prefijo `+593` y validación en vivo.
  - Mensaje predeterminado de cotización editable.
  - WhatsApp de urgencias para planta.
  - Switch de activación del widget flotante.
  - Inputs dedicados para LinkedIn B2B, Facebook, Instagram, TikTok y YouTube.
- **Storefront (`src/components/TenantLandingView.tsx`)**:
  - Todos los botones de cotización consumen el número normalizado y el mensaje predeterminado.
  - Enlaces oficiales en pie de página.
  - Widget flotante interactivo en esquina inferior con pulso de atención.
- **Tests Automatizados**:
  - Suite `tests/whatsapp-and-social.test.js` superada al 100% (5/5 bloques).
  - Regresiones verificadas: todas las 6 suites ejecutadas con éxito.
- **Compilación & Build**:
  - `npx tsc --noEmit`: 0 errores.
  - ESLint: 0 errores.
  - `next build`: 35 rutas compiladas exitosamente. Versión incrementada a v1.0.124.
- **RDD**: Revisión aprobada y recibo quemado (`review-1740719151d35d6a`).
