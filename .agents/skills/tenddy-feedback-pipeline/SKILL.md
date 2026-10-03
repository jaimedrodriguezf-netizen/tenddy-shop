---
name: tenddy-feedback-pipeline
description: "Trigger: vamos a revisar los feedback, revisar feedback, revisar los tickets, siguiente ticket, resolver feedback uno por uno. Resuelve tickets de soporte de forma atómica: exactamente uno por uno, con build, commit, push y cierre antes de pasar al siguiente."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Activar inmediatamente cuando el usuario diga "vamos a revisar los feedback", "revisar tickets", "siguiente feedback" o solicite procesar requerimientos de usuarios de tenddy-shop.

## Hard Rules

- **Cero acumulación:** NUNCA agrupar múltiples tickets para resolverlos en una sola tanda. Siempre tomar exactamente **UNO** a la vez.
- **Flujo atómico cerrado:** No se puede pasar al siguiente ticket hasta que el actual esté implementado, verificado con `npm run build`, marcado como `resolved` en Supabase, commiteado y pusheado a GitHub con versión incrementada (`npm run bump`).
- **Seguridad en Git:** Jamás commitear secretos (`.env.local`, `.mcp.json`).

## Decision Gates

| Condición | Acción |
| --- | --- |
| Hay múltiples tickets abiertos | Seleccionar el ticket abierto más antiguo o de mayor bloqueo técnico (exactamente uno). |
| El ticket tiene captura webp | Descargarla a `/tmp/` e inspeccionarla con `read` antes de escribir código. |
| El código fue modificado | Correr `tsc --noEmit` y `npm run build`. Si falla, corregir antes de cualquier commit. |
| El build está en verde | 1. Marcar ticket en Supabase como `resolved`. 2. `npm run bump`. 3. `git commit` + `git push`. 4. Informar y esperar confirmación del usuario para el siguiente. |

## Execution Steps

1. **Consultar y Seleccionar:**
   - Consultar `support_tickets` en Supabase (`status = 'open'`).
   - Tomar **un único ticket** y mostrar su número, remitente, mensaje y captura al usuario.
2. **Diagnóstico & Implementación:**
   - Inspeccionar la captura adjunta.
   - Realizar la modificación exacta en frontend/backend/base de datos.
3. **Verificación Estricta:**
   - Ejecutar `./node_modules/.bin/tsc --noEmit`.
   - Ejecutar `npm run build`.
4. **Cierre de Ticket en Supabase:**
   - Actualizar el ticket en Supabase a `status = 'resolved'`.
5. **Versionado, Commit y Push:**
   - Ejecutar `npm run bump` (incrementa patch en `package.json` y `version.json`).
   - `git add` de los archivos modificados.
   - `git commit -m "fix/feat: <descripción concisa> (ticket #XXXX), bump to vX.X.X"`.
   - `git push origin main`.
6. **Reportar y Pausar:**
   - Presentar el ticket resuelto, la versión resultante y el commit pusheado.
   - Preguntar explícitamente: "¿Avanzamos con el siguiente ticket?".

## Output Contract

- Ticket procesado (ID, remitente, requerimiento).
- Archivos modificados y solución técnica aplicada.
- Estado de verificación (`npm run build` en verde).
- Commit hash y nueva versión pusheada.
- Consulta de confirmación para pasar al siguiente ítem.
