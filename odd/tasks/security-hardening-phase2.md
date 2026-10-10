# Tareas ODD: Blindaje de Seguridad y Almacenamiento Seguro de Imágenes (Fase 2)

## Contexto
Auditoría y mitigación integral de 6 vectores de seguridad identificados en la plataforma Tenddy:
1. Prevención de BOLA / Cross-Tenant Tampering y filtrado estricto de adjuntos en réplicas de soporte.
2. Garantía arquitectónica de que las imágenes se almacenen en Supabase Storage (URL pública) y jamás en columnas de la base de datos como base64.
3. Exigencia de `verifyTenantAdmin` en métodos GET de catálogos y atributos administrativos.
4. Mitigación de Timing Attacks en validación de contraseñas y llaves maestras con `crypto.timingSafeEqual`.
5. Sanitización de excepciones crudas de PostgreSQL en endpoints de API.
6. Migración RLS idempotente `0016_harden_support_tickets_rls.sql` para bloquear accesos directos anónimos a `support_tickets`.

## Tareas

- [x] **Tarea 1**: Blindar `src/app/api/admin/support/comments/route.ts` contra BOLA, restringir a Supabase Storage con whitelist MIME y límite de 5MB.
- [x] **Tarea 2**: Exigir `verifyTenantAdmin` en GET de `brands`, `attributes`, `tags` y `categories`; validar que `appearance` nunca acepte base64 en `logo_url` o `hero_image_url`.
- [x] **Tarea 3**: Implementar comparación en tiempo constante (`crypto.timingSafeEqual`) en `superadmin/auth` y `admin/auth`, y blindar `src/lib/session.ts` ante ausencia de secretos en producción.
- [x] **Tarea 4**: Sanitizar mensajes de error de base de datos en `views`, `auth/me`, `admin/quotes`, `admin/members`, `superadmin/support`, `superadmin/users`, `b2b/customers`.
- [x] **Tarea 5**: Crear migración Supabase RLS `0016_harden_support_tickets_rls.sql` bloqueando `anon` en `support_tickets`.
- [x] **Tarea 6**: Ejecutar chequeos (`tsc --noEmit`, build), actualizar versión e integrar a main.
