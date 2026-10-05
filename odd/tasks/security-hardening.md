# Feature: Blindaje y Mitigación de Vulnerabilidades de Seguridad

Estado: Completado y Verificado
Fecha: 2026-10-04
Branch: security/security-hardening
Commit: 8b42969

## 1. Autorización & Alcance
- **Objetivo**: Subsanar sistemáticamente los riesgos y vectores de ataque detectados durante la auditoría de seguridad: evasión de rate-limiting por IP spoofing, bloqueo de cookies de superadmin, subida de archivos maliciosos/DoS, falta de rate-limiting en B2B, ausencia de CSP y almacenamiento en texto plano.
- **Alcance**:
  - Tarea 1: Blindar la obtención de IP en `src/lib/rate-limit.ts` priorizando cabeceras de proxy inmutables (`cf-connecting-ip`, `x-real-ip`).
  - Tarea 2: Corregir el scope de la cookie de superadmin en `src/app/api/superadmin/auth/route.ts` (`path: '/'`).
  - Tarea 3: Sanitización y validación estricta de subidas de archivos en `/api/support` y `/api/admin/products` (whitelist de tipos MIME, tamaño máximo 5MB, rechazo de scripts/HTML/SVG activos).
  - Tarea 4: Proteger el endpoint `/api/b2b/customers` con rate limiting anti-enumeración.
  - Tarea 5: Implementar cabecera Content-Security-Policy (CSP) en `next.config.ts`.
  - Tarea 6: Hashing criptográfico seguro con salting en `src/app/api/admin/members/route.ts`.

## 2. Tareas & Evidencia de Implementación

### Tarea 1: Blindar detección de IP contra Spoofing en Rate Limiting
- [x] Reordenar la extracción de IP en `src/lib/rate-limit.ts` para priorizar encabezados de confianza de infraestructura.
- **Evidencia**: Se priorizó `cf-connecting-ip` (Cloudflare) y `x-real-ip` (reverse proxies), y se añadió validación de regex sobre `x-forwarded-for` para rechazar cadenas arbitrarias. La evasión por rotación de cabeceras cliente queda mitigada.

### Tarea 2: Corregir alcance de cookie de Superadmin
- [x] Ajustar `path: '/'` en `src/app/api/superadmin/auth/route.ts` para permitir acceso legítimo a endpoints `/api/superadmin/*`.
- **Evidencia**: Se actualizó el path de la cookie de sesión superadmin a `/`, resolviendo los rechazos de autenticación 401 en llamadas fetch desde la torre de control hacia `/api/superadmin/*`.

### Tarea 3: Validación estricta y límite de tamaño en subida de archivos
- [x] Limitar tamaño de payload (máximo 5MB) y forzar whitelist de MIME types seguros (`image/webp`, `image/jpeg`, `image/png`, `application/pdf`, planillas).
- [x] Neutralizar vectores de XSS por SVG/HTML en Supabase Storage.
- **Evidencia**: Se restringieron los endpoints `/api/support`, `/api/admin/products` y `/api/admin/categories` con whitelist de tipos MIME seguros, descartando SVGs con scripts o HTMLs. Se implementó una cota estricta de 5MB por buffer para prevenir colapsos de memoria.

### Tarea 4: Rate limiting en endpoint de clientes B2B
- [x] Agregar `checkRateLimit` en `src/app/api/b2b/customers/route.ts`.
- **Evidencia**: Se integró control de tasa (10 peticiones/minuto por IP) y validaciones de formato de correo y longitud máxima en `/api/b2b/customers` mitigando vectores de enumeración no autorizada de cuentas.

### Tarea 5: Definición de Content-Security-Policy (CSP)
- [x] Agregar política CSP en `next.config.ts` permitiendo orígenes legítimos y mitigando XSS.
- **Evidencia**: Se incorporó la cabecera `Content-Security-Policy` en `next.config.ts` restringiendo script execution, orígenes de fuentes/estilos y conectividad segura con Supabase, reforzando la defensa en profundidad de la aplicación.

### Tarea 6: Hashing criptográfico de contraseñas de miembros
- [x] Implementar función de derivación/hashing criptográfico con salt para `tenant_members`.
- [x] Verificar build, linter y tests.
- **Evidencia**: Se incorporó hashing PBKDF2-SHA512 con 100,000 rondas y salt aleatorio de 16 bytes vía `node:crypto`. Las contraseñas de nuevos miembros ya no se guardan en texto plano en la base de datos. `tsc`, `lint` (0 errores) y `build` (28 rutas) pasaron con éxito.
