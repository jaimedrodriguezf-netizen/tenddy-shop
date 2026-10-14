# Tareas ODD: Subida Interactiva de Logo en Panel y Branding en Storefront

## Contexto y Alcance
Implementación de la experiencia completa de subida y visualización de logo corporativo para las tiendas:
1. **Panel Administrativo (`AppearanceTab.tsx`)**: Sustituir el campo de texto manual por un selector de archivo interactivo (PNG/WebP/JPG, máx 2MB) con botón de subida directa a Supabase Storage (`POST /api/admin/media`), vista previa en vivo y opción de URL manual alternativa.
2. **Backend Defensivo (`/api/admin/appearance/route.ts`)**: Corregir `sanitizeImageUrl` para aceptar tanto URLs remotas `https://...` como rutas locales `/assets/...` sin borrar logos existentes.
3. **Storefront Branding (`TenantLandingView.tsx`)**: Conectar `tenant.logo_url` en la cabecera principal con contenedor rígido (`h-9 w-auto`, `shrink-0`) y carga prioritaria (`loading="eager"`), con fallback a monograma institucional cuando no haya logo configurado.
4. **Verificación**: Tests automatizados, Puppeteer E2E, linter, build y ciclo RDD.

## Tareas

- [x] **Tarea 1**: Implementar selector de archivo, preview y subida directa de logo en `AppearanceTab.tsx`.
- [x] **Tarea 2**: Blindar `sanitizeImageUrl` en `/api/admin/appearance` para permitir rutas absolutas y relativas.
- [x] **Tarea 3**: Integrar `tenant.logo_url` en la cabecera de `TenantLandingView` con dimensiones fijas y fallback.
- [x] **Tarea 4**: Verificar con tests automatizados, build, ciclo RDD y registrar evidencias ODD.

## Evidencia de Verificación
- **Subida Interactiva en Panel (`AppearanceTab.tsx`)**: Se integró selector de archivos con whitelist (PNG transparente, WebP, JPG, máx 2MB), botón "Subir Logotipo", vista previa en vivo sobre contenedor cuadriculado, subida directa a Supabase Storage (`POST /api/admin/media` con folder `logos`) y opción alternativa de URL manual.
- **Backend Blindado (`/api/admin/appearance/route.ts`)**: `sanitizeImageUrl` ahora acepta rutas locales seguras que empiezan con `/` (evitando protocol-relative `//` o javascript), permitiendo rutas como `/assets/logo-header.png` sin ser anuladas a null.
- **Header con Logo y Cero Parpadeo (`TenantLandingView.tsx`)**: Se conectó `tenant.logo_url` en un contenedor rígido (`h-10 w-auto max-w-[160px] shrink-0`) con `loading="eager"` para evitar Layout Shift (CLS = 0) y renderizado inmediato vía SSR. Se incluye fallback a monograma estilizado con iniciales cuando no hay logo.
- **Tests Automatizados**: `tests/logo-uploader.test.js` superado al 100%. Verificación con Puppeteer confirmó la presencia del logo oficial en el header.
- **Compilación**: TypeScript limpio, 0 errores de ESLint, `next build` exitoso en 35 rutas. Versionado v1.0.112.
- **RDD**: Revisión aprobada y recibo quemado (`review-40b0731bbceca113`).
- **Commit**: `d829d5a` en branch `feat/logo-uploader-and-storefront-branding`.
