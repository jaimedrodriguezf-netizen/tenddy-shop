# Tareas ODD: Aislamiento de Carrito Multi-Tenant y Estabilidad de Slugs de Productos

## Contexto
Mitigación de 3 problemas críticos de arquitectura, multi-tenant y SEO:
1. Aislamiento estricto de carritos por tienda (`tenant_id`) en `useCartStore`, `CartDrawer.tsx` y `TenantCatalogView.tsx`, evitando contaminación cruzada entre tiendas en el mismo navegador.
2. Validación multi-tenant de pertenencia de productos en cotizaciones en `src/app/api/quotes/route.ts` (rechazar items de otros tenants).
3. Preservación estable de slugs de productos en `PATCH /api/admin/products` (evitando regeneración aleatoria y ruptura de enlaces compartidos/SEO).
4. Protección contra reverse tabnabbing con `noopener,noreferrer` en `ProductDetailView.tsx`.

## Tareas

- [x] **Tarea 1**: Aislar el carrito por tienda en `useCartStore`, `CartDrawer.tsx` y `TenantCatalogView.tsx`.
- [x] **Tarea 2**: Validar pertenencia estricta de `product_id` al `tenant_id` en `src/app/api/quotes/route.ts`.
- [x] **Tarea 3**: Preservar y respetar slugs existentes/personalizados en `PATCH /api/admin/products`, y añadir `noopener,noreferrer` en `ProductDetailView.tsx`.
- [x] **Tarea 4**: Verificar compilación y build, ejecutar revisión RDD, bump a v1.0.104 y merge a `main`.
