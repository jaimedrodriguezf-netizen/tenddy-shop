# Tareas ODD: Optimización de Rendimiento, Blindaje XSS y Trazabilidad de Cotizaciones en AYME PET

## Contexto y Alcance
Refactorización de seguridad, rendimiento y escalabilidad en AYME INDUSTRIAS PET (`ayme-pet` / `public/standalone.html`):
1. **Rendimiento**: Desactivar la precarga masiva ociosa de 144 imágenes (32 MB) en `public/js/scroll-sequence.js`. El hero usa el video de fondo en alta calidad (`process-video.mp4`) mientras el canvas permanecía en `opacity: 0`. Se optimiza el motor de scroll para mantener telemetría y transiciones sin gastar CPU/GPU en bucles 60fps de canvas invisible.
2. **Seguridad**: Blindar contra XSS en `public/js/products.js`, `public/js/cart.js`, `public/js/services.js` y `public/js/app.js` sanitizando datos inyectados en `innerHTML` y atributos HTML, eliminando interpolaciones vulnerables en `onclick`.
3. **Escalabilidad y Negocio**: Sincronizar las cotizaciones del checkout de WhatsApp con `POST /api/quotes` en `public/js/cart.js`, garantizando trazabilidad y registro en el panel de control (`/store/ayme-pet/admin`).
4. **Verificación**: Comprobación con tests E2E de Puppeteer, `tsc`, `lint` y `build`.

## Tareas

- [x] **Tarea 1**: Desactivar precarga masiva de 32MB y render loop ocioso en `scroll-sequence.js` manteniendo transiciones de scroll.
- [x] **Tarea 2**: Blindar renderizado contra XSS en `products.js`, `cart.js`, `services.js` y `app.js`.
- [x] **Tarea 3**: Conectar cotizaciones de WhatsApp con `POST /api/quotes` para trazabilidad en backoffice.
- [x] **Tarea 4**: Verificar compilación, linter, tests E2E y registrar evidencias ODD.

## Evidencia de Verificación
- **Rendimiento**: Se eliminó la descarga masiva de 144 imágenes JPEG (`/assets/sequence/frame_XXXX.jpg`, 32 MB) en `public/js/scroll-sequence.js`. La experiencia se basa en el video MP4 (`process-video.mp4`, 3MB), con animación lerp y telemetría calculada bajo demanda sin bucle continuo de 60 FPS ocioso.
- **Seguridad (XSS)**: Se añadió `escapeHtml` en `public/js/data.js` y se sanitizaron todas las interpolaciones de strings en `innerHTML` y atributos HTML en `products.js`, `cart.js`, `services.js` y `app.js`. Se reemplazaron manejadores inline vulnerables (`onclick="...('${prod.id}')"`) por delegación de eventos con data-attributes.
- **Cotizaciones B2B**: `public/js/cart.js` envía la cotización en segundo plano a `POST /api/quotes` con `tenant_id` y `product_id` válidos antes de abrir WhatsApp, garantizando persistencia en base de datos y visibilidad en `/store/ayme-pet/admin`.
- **Tests**: Suite específica `tests/ayme-perf-and-security.test.js` ejecutada con 100% de éxito (5/5). Suite E2E de Puppeteer superada en las vistas de AYME PET.
- **Build & Lint**: `npx tsc --noEmit` limpio, `eslint` 0 errores, `next build` exitoso (35 rutas). Bump a v1.0.105.
- **RDD**: Revisión aprobada y recibo quemado (`review-f2548fa756b28f2e`).
- **Commit**: `736daaf` en branch `perf/ayme-pet-perf-and-security`.
