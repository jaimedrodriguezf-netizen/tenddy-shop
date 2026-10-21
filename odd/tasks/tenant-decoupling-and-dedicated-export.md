# Desacople de Base de Datos y Exportación a Instancia Dedicada para Superadmin
Capacidad en la torre de control de Superadmin para desacoplar tenants de Tenddy y exportar su esquema/datos hacia una base de datos Supabase dedicada o redirigir a su tienda personalizada.

## Specs
- S1: "el superadmin deberia tener la opcion de descoplar de la base de datos para qie ya no use tenddy sino dircto desde su tiwnda perzonalizada ?". Crear el motor y endpoint administrativo `/api/superadmin/tenants/export` para extraer de forma aislada e íntegra todos los datos del tenant (perfil, dominios, sucursales, categorías, productos, clientes B2B y cotizaciones) en formato SQL portable para Supabase y en formato JSON.
- S2: Incorporar el estado de desacople (`is_decoupled`, `decoupled_url`) en la configuración del tenant, permitiendo al Superadmin activar la redirección automática o portal de tienda personalizada cuando un usuario accede a `/store/[shopSlug]`.
- S3: Diseñar el modal y herramientas de "Instancia Dedicada & Desacople" en `SuperadminDashboardView.tsx`, permitiendo descargar el dump SQL/JSON con un clic, activar/desactivar el modo desacoplado y fijar la URL de la tienda externa.
- S4: Blindar la seguridad de la exportación bajo `verifySuperadminToken` con auditoría y sanitización estricta para prevenir filtración cruzada entre tenants.
- S5: Desarrollar pruebas automatizadas unitarias en `tests/tenant-decoupling.test.js` que certifiquen el empaquetado SQL, la sanitización y el comportamiento del modo desacoplado.

## Tasks
- [x] T1 (S1, S4): Crear el servicio y endpoint `/api/superadmin/tenants/export/route.ts` con generación de dump SQL/JSON de tablas asociadas y blindaje de sesión superadmin. (Commit: 40e040c)
- [x] T2 (S2): Integrar el soporte de modo desacoplado (`is_decoupled`, `decoupled_url`) en la API de tenants `/api/superadmin/tenants/route.ts` y en la vista del Storefront `/app/store/[shopSlug]/page.tsx`. (Commit: 40e040c)
- [x] T3 (S3): Agregar la interfaz gráfica en `SuperadminDashboardView.tsx` con modal de graduación/desacople, descarga de dump y control de redirección. (Commit: 40e040c)
- [x] T4 (S5): Crear y ejecutar la suite de pruebas automatizadas `tests/tenant-decoupling.test.js` verificando exportación SQL y redirección. (Commit: 40e040c)

## Evidencia de Verificación
- **Motor de Exportación Atómica**: Endpoint `/api/superadmin/tenants/export` ensambla dumps SQL autónomos con transacciones seguras `BEGIN...COMMIT` y descarga de archivos JSON/SQL para PostgreSQL/Supabase.
- **Seguridad HMAC**: Acceso restringido exclusivamente a sesiones válidas de Superadmin con `verifySuperadminToken`.
- **Modo Desacoplado**: Redirección HTTP 307 instantánea en `/store/[shopSlug]` para clientes públicos cuando `is_decoupled` está activo y existe `decoupled_url`, preservando acceso con banner de auditoría para administradores.
- **Interfaz Torre de Control**: `DecoupleTenantModal.tsx` integrado en `SuperadminDashboardView.tsx`, permitiendo descargar dumps en un clic, activar/desactivar desacople y mostrando el badge distintivo `⚡ Desacoplada`.
- **Suite de Pruebas**: `tests/tenant-decoupling.test.js` ejecutado al 100% exitosamente sin errores de compilación TypeScript.

## Log
- L1: Solicitud del usuario: "el superadmin deberia tener la opcion de descoplar de la base de datos para qie ya no use tenddy sino dircto desde su tiwnda perzonalizada ?" y confirmación "ok hagamoslo".
