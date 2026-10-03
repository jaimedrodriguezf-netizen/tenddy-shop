---
name: tenddy-feedback-pipeline
description: "Trigger: vamos a revisar los feedback, revisar feedback, revisar los tickets, siguiente ticket, resolver feedback uno por uno. Resuelve tickets de soporte de forma atómica: exactamente uno por uno, con 2 compuertas estrictas de aprobación humana (Diagnóstico -> Aprobación -> Solución -> Aprobación -> Commit/Push)."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.1"
---

## Activation Contract

Activar inmediatamente cuando el usuario diga "vamos a revisar los feedback", "revisar tickets", "siguiente feedback" o solicite procesar requerimientos de usuarios de tenddy-shop.

## Hard Rules

- **Cero acumulación:** NUNCA agrupar múltiples tickets. Siempre tomar exactamente **UNO** a la vez.
- **Dos compuertas de aprobación humana obligatorias:**
  - **Compuerta 1 (Pre-código):** Presentar diagnóstico del ticket y esperar aprobación explícita del usuario antes de tocar código.
  - **Compuerta 2 (Post-solución):** Presentar la solución técnica y verificación antes de cualquier commit o push.
- **Commit y Push condicionados:** NUNCA hacer commit ni push hasta que el usuario haya aprobado la solución terminada.
- **Seguridad en Git:** Jamás commitear secretos (`.env.local`, `.mcp.json`).

## Decision Gates

| Fase | Acción | Gate |
| --- | --- | --- |
| 1. Diagnóstico | Seleccionar 1 ticket abierto, inspeccionar captura webp y presentar diagnóstico y plan técnico. | **STOP: Esperar aprobación del usuario.** |
| 2. Implementación | Tras aprobación, modificar código y verificar con `tsc --noEmit` y `npm run build`. | Continuar a reporte de solución. |
| 3. Revisión de Solución | Explicar detalladamente cómo se solucionó y el resultado del build. | **STOP: Esperar aprobación del usuario.** |
| 4. Cierre y Entrega | Tras aprobación: marcar `resolved` en Supabase, `npm run bump`, `git commit` y `git push`. | Confirmar y consultar si se avanza al siguiente ticket. |

## Execution Steps

### Paso 1: Diagnóstico (1 Ticket a la vez)
1. Consultar `support_tickets` en Supabase (`status = 'open'`).
2. Seleccionar el ticket más prioritario o antiguo.
3. Descargar la captura webp a `/tmp/` e inspeccionarla con `read`.
4. Presentar al usuario:
   - Número de ticket, remitente y mensaje textual.
   - Diagnóstico de la captura y del código actual.
   - Plan técnico propuesto para solucionarlo.
5. **PAUSAR Y ESPERAR:** Preguntar "¿Apruebas este diagnóstico y plan para proceder?".

### Paso 2: Implementación & Verificación
*(Solo tras recibir la aprobación del Paso 1)*
1. Realizar las modificaciones en frontend, backend o base de datos.
2. Ejecutar `./node_modules/.bin/tsc --noEmit`.
3. Ejecutar `npm run build`.

### Paso 3: Presentación de la Solución
1. Explicar claramente al usuario:
   - Qué archivos se modificaron y qué lógica se cambió.
   - Evidencia de que compila en verde (`next build`).
2. **PAUSAR Y ESPERAR:** Preguntar "¿Apruebas esta solución para hacer commit y push?".

### Paso 4: Cierre, Versionado, Commit y Push
*(Solo tras recibir la aprobación del Paso 3)*
1. Actualizar el ticket en Supabase a `status = 'resolved'`.
2. Ejecutar `npm run bump` (incrementa versión SemVer).
3. `git add` de los archivos involucrados (sin secretos).
4. `git commit -m "fix/feat: <descripción> (ticket #XXXX), bump to vX.X.X"`.
5. `git push origin main`.
6. Informar commit y nueva versión, y preguntar si pasamos al siguiente ticket.

## Output Contract

- Respeto estricto del orden: Diagnóstico -> Aprobación -> Solución -> Aprobación -> Commit/Push.
- Nunca adelantar pasos ni commitear antes de la aprobación final.
