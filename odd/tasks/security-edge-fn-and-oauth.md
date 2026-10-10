# Tareas ODD: Blindaje de Edge Function de Telegram y Protección de Host en OAuth

## Contexto
Mitigación de 2 vectores de seguridad identificados:
1. Protección de la Supabase Edge Function `support-notification` contra invocaciones anónimas no autorizadas y blindaje contra inyección HTML en Telegram.
2. Mitigación de Host Header Injection y Open Redirect en `src/app/auth/callback/route.ts` validando el host contra una whitelist de dominios autorizados.

## Tareas

- [x] **Tarea 1**: Blindar `src/app/auth/callback/route.ts` validando `host` contra whitelist en `getSafeOrigin`.
- [x] **Tarea 2**: Blindar `supabase/functions/support-notification/index.ts` con verificación de autorización y sanitización de `image_url`.
- [x] **Tarea 3**: Desplegar la actualización de la Edge Function en Supabase y activar `verify_jwt: true` vía Management API.
- [x] **Tarea 4**: Verificar compilación y build, ejecutar revisión RDD, bump a v1.0.99 y cerrar ciclo.
