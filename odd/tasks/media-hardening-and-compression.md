# Tareas ODD: Optimización, Compresión y Blindaje del Módulo de Medios

## Contexto
Optimización integral de rendimiento, escalabilidad y seguridad en la biblioteca de medios:
1. Paralelización de consultas de Storage y PostgreSQL en `GET /api/admin/media` con `Promise.all` para reducir latencia.
2. Implementación de Rate Limiting en `POST` y `GET` de medios para prevenir abusos y agotamiento de almacenamiento.
3. Validación de Magic Bytes binarios en el backend para neutralizar MIME-spoofing en subidas.
4. Integración del compresor de imágenes del cliente (`compressImageToFile`) en `MediaLibraryView.tsx` antes de subir fotos pesadas, reduciendo el peso de 15MB a ~200KB.
5. Corrección de efectos React 19 y limpieza de linter en `MediaLibraryView.tsx`.

## Tareas

- [x] **Tarea 1**: Agregar helper `compressImageToFile` en `src/lib/image-compressor.ts` e integrarlo en `MediaLibraryView.tsx` para compresión previa a la subida.
- [x] **Tarea 2**: Paralelizar consultas en `GET /api/admin/media`, agregar rate limiting y validación de Magic Bytes en `POST`.
- [x] **Tarea 3**: Corregir llamadas sincrónicas de `setState` en efectos de `MediaLibraryView.tsx` para compatibilidad total con React 19 / ESLint 9.
- [x] **Tarea 4**: Verificar compilación, ejecutar build de producción, revisión RDD, bump de versión y merge a `main`. (Commit: `44060aa`, RDD `review-97a4cb72cf40c0cf` burned).
