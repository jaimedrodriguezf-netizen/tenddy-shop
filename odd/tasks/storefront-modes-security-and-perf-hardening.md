# Tareas ODD: Blindaje de Seguridad, Aislamiento Multi-Tenant y Rendimiento en Modos de Storefront

## Contexto y Alcance
Refuerzo de seguridad, aislamiento de datos y rendimiento en las plantillas de tienda (`TenantLandingView.tsx` y `TenantCatalogView.tsx`):
1. **Seguridad & Multi-Tenant**: Pasar `tenant.id` a `getTotalUnits(tenant.id)` y `getTotalPackages(tenant.id)` en `TenantLandingView.tsx` para evitar contaminación cruzada de bultos entre tiendas. Sanitizar números de WhatsApp (`.replace(/\D/g, '')`) y añadir `noopener,noreferrer` en `window.open` y enlaces externos.
2. **Rendimiento & DOM**: Añadir `preload="metadata"` al elemento `<video>` de la Landing para acelerar el LCP en conexiones móviles. Implementar corte progresivo de productos (24 iniciales con botón *"Cargar más"*) para evitar sobrecarga del DOM en catálogos extensos.
3. **Validación**: Pruebas automatizadas, `tsc`, `lint`, `build` y auditoría RDD.

## Tareas

- [x] **Tarea 1**: Blindar aislamiento multi-tenant en carrito y seguridad de enlaces WhatsApp.
- [x] **Tarea 2**: Optimizar carga de video en Hero y paginación progresiva en `TenantLandingView`.
- [x] **Tarea 3**: Verificar con tests automatizados, build, ciclo RDD y registrar evidencias ODD.

## Evidencia de Verificación
- **Aislamiento Multi-Tenant**: `TenantLandingView.tsx` ahora aísla el conteo de unidades y bultos pasando `tenant.id` a `getTotalUnits(tenant.id)` y `getTotalPackages(tenant.id)`, evitando interferencias entre tiendas en el mismo navegador.
- **Seguridad en WhatsApp**: Tanto en `TenantLandingView.tsx` como en `TenantCatalogView.tsx`, se sanitizan los números de teléfono con `.replace(/\D/g, '')` para evitar enlaces rotos, y se blindaron las aperturas de ventana externa con `'noopener,noreferrer'` contra *reverse tabnabbing*.
- **Rendimiento LCP & DOM**: El elemento `<video>` del Hero en la Landing incorpora `preload="metadata"` para no saturar el ancho de banda inicial. La grilla de productos implementa paginación progresiva (24 referencias iniciales + botón *"Ver más referencias"*), preservando el scroll fluido a 60 FPS.
- **Tests Automatizados**: `tests/storefront-hardening.test.js` superado al 100% (4/4). Todos los tests previos del proyecto se ejecutaron sin regresiones.
- **Compilación**: TypeScript limpio, 0 errores ESLint, `next build` exitoso en 35 rutas. Versionado a v1.0.113.
- **RDD**: Revisión aprobada y recibo quemado (`review-3295dd4c0a0c7c29`).
- **Commit**: `39ad409` en branch `perf/storefront-modes-security-and-perf-hardening`.
