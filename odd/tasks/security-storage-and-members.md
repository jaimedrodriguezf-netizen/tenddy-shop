# Tareas ODD: Blindaje de Supabase Storage y Protección de Roles de Miembros

## Contexto
Mitigación de 2 vulnerabilidades críticas/altas detectadas en la plataforma:
1. Revocación de permisos públicos de mutación/eliminación en `storage.objects` sobre el bucket `support-attachments`.
2. Protección inmutable contra eliminación del propietario (`owner`), secuestro de tienda o auto-escalación de roles en `src/app/api/admin/members/route.ts`.
3. Sanitización defensiva adicional en `tenants/register` y `store/[shopSlug]/products`.

## Tareas

- [x] **Tarea 1**: Blindar `src/app/api/admin/members/route.ts` contra eliminación y modificación no autorizada de roles `owner` y escalación de privilegios.
- [x] **Tarea 2**: Crear migración `supabase/migrations/0017_harden_storage_objects_rls.sql`, eliminar la política permisiva de `storage.objects` y aplicarla vía MCP a la BD.
- [x] **Tarea 3**: Sanitizar retornos de error en `tenants/register/route.ts` y `store/[shopSlug]/products/route.ts`.
- [x] **Tarea 4**: Verificar compilación y build, ejecutar revisión RDD, bump a v1.0.98 y cerrar ciclo.
