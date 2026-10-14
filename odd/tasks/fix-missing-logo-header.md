# Tareas ODD: Corrección de 404 en Logo de AYME PET y CDN de Almacenamiento

## Contexto y Alcance
El navegador arrojaba `GET https://tenddy.shop/assets/logo-header.png 404 (Not Found)`:
1. En el repositorio solo existía `public/assets/logo.png`, mientras que en Supabase la tienda tenía configurado `logo_url: '/assets/logo-header.png'`, provocando un 404 y dejando el logo vacío.
2. Se resuelve duplicando el asset físico a `public/assets/logo-header.png` en el repositorio para compatibilidad local y de rutas estáticas.
3. Se subió el archivo oficial a Supabase Storage CDN en `logos/c2f7cdd7-d590-4a73-a8e8-0c3f120a7dbe/logo.png` y se actualizó la columna `logo_url` del tenant a su URL permanente de CDN con HTTPS.
4. Verificación de código 200 en Storage y en servidor local y producción.

## Tareas

- [x] **Tarea 1**: Crear archivo `public/assets/logo-header.png` y subir a Supabase Storage CDN.
- [x] **Tarea 2**: Actualizar `logo_url` de `ayme-pet` a la URL permanente de Supabase Storage.
- [x] **Tarea 3**: Verificar con test automatizado, build, RDD y enviar a producción.

## Evidencia de Verificación
- **Archivo Físico Creado**: `public/assets/logo-header.png` generado desde `public/assets/logo.png` (192 KB, 1024x519 PNG).
- **Subida a CDN Supabase**: Guardado en `support-attachments/logos/c2f7cdd7-d590-4a73-a8e8-0c3f120a7dbe/logo.png` con respuesta HTTP 200 en CDN pública.
- **Base de Datos Sincronizada**: Tenant `ayme-pet` actualizado con la URL permanente de Supabase Storage.
- **Tests Automatizados**: `tests/logo-header-resolution.test.js` superado al 100%.
- **Compilación**: TypeScript limpio, ESLint sin errores, Next.js build exitoso en 35 rutas. Versionado a v1.0.114.
- **RDD**: Revisión aprobada y recibo quemado (`review-a7f5c097adfe3058`).
- **Commit**: `729f25a` en branch `main`.
