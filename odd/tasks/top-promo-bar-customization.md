# Tareas ODD: Personalización y Control On/Off de la Mini Barra Superior (Top Promo Bar)

## Contexto y Alcance
El usuario solicitó que la mini barra superior de la tienda (`top-promo-bar`), que actualmente muestra:
`🏭 AYME INDUSTRIAS PET | Solutions in Packaging • 📦 Ventas Mayoristas & Fabricación de Moldes • 📱 WhatsApp Comercial: 0998722324`
sea 100% editable por el usuario desde el panel de administración (`/store/[shopSlug]/admin` -> Diseño & Apariencia), incluyendo:
1. Opción de **activar y desactivar** la barra superior (`show_top_bar`: boolean).
2. Campo de texto para **editar el contenido del mensaje** (`top_bar_text`: string).
3. Vista previa interactiva en el panel antes de guardar.
4. Persistencia en Supabase en `landing_config` y `theme_config`.
5. Renderizado dinámico en el storefront (`TenantLandingView.tsx`).

## Tareas

- [x] **Tarea 1**: Actualizar tipado en `src/lib/types.ts` (`show_top_bar`, `top_bar_text`).
- [x] **Tarea 2**: Soportar `show_top_bar` y `top_bar_text` en backend `src/app/api/admin/appearance/route.ts`.
- [x] **Tarea 3**: Integrar control toggle on/off, input de texto y preview en `src/components/AppearanceTab.tsx`.
- [x] **Tarea 4**: Renderizar dinámicamente la mini barra en `src/components/TenantLandingView.tsx`.
- [x] **Tarea 5**: Crear tests automatizados, verificar compilación (`tsc`, `lint`, `next build`) y evidencias ODD.

## Evidencia de Verificación
- **Tipado (`src/lib/types.ts`)**:
  - `show_top_bar?: boolean` y `top_bar_text?: string` añadidos formalmente tanto a `theme_config` como a `landing_config`.
- **Backend (`src/app/api/admin/appearance/route.ts`)**:
  - Extracción, validación booleana y sanitización de texto para `show_top_bar` y `top_bar_text`.
  - Persistencia segura en Supabase en ambas estructuras de configuración.
- **Panel Administrativo (`src/components/AppearanceTab.tsx`)**:
  - Bloque visual "Mini Barra Superior de Notificación (Top Promo Bar)" con icono `Megaphone`.
  - Switch interactivo para encender/apagar la barra con badges de estado "Activa" / "Oculta".
  - Textarea para edición libre del anuncio con soporte para emojis y separadores `•`.
  - Botón para restablecer al texto por defecto de fábrica.
  - Caja de vista previa en vivo que renderiza inmediatamente el texto tipeado.
- **Storefront (`src/components/TenantLandingView.tsx`)**:
  - Renderizado condicional `{showTopBar && ...}` que oculta la barra por completo cuando está desactivada.
  - Soporte inteligente para segmentación por viñetas `•` o texto continuo con fallback automático.
- **Tests Automatizados**:
  - Suite `tests/top-promo-bar.test.js` superada al 100% (4/4 bloques de prueba).
  - Regresiones verificadas: todas las 5 suites anteriores pasadas con éxito.
- **Compilación & Build**:
  - `npx tsc --noEmit`: 0 errores.
  - ESLint: 0 errores.
  - `next build`: 35 rutas compiladas exitosamente. Versión incrementada a v1.0.123.
- **RDD**: Revisión aprobada y recibo quemado (`review-fa765acc7313e54b`).
