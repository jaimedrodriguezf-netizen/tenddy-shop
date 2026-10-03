---
name: tenddy-feedback-pipeline
description: "Trigger: vamos a revisar los feedback, revisar feedback, revisar los tickets, siguiente ticket, resolver feedback uno por uno. Resuelve tickets de soporte de forma atómica: uno por uno, con 2 compuertas de aprobación humana, tono comercial sin tecnicismos y filtro de alcance para ecommerce."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.2"
---

## Activation Contract

Activar inmediatamente cuando el usuario diga "vamos a revisar los feedback", "revisar tickets", "siguiente feedback" o solicite procesar requerimientos de usuarios de tenddy-shop.

## Hard Rules

- **Cero acumulación:** NUNCA agrupar múltiples tickets. Siempre tomar exactamente **UNO** a la vez.
- **Tono Comercial y Cero Jerga Técnica (Regla de Oro):**
  - Los usuarios son comerciantes, vendedores y dueños de tiendas de ecommerce, NO ingenieros de software.
  - PROHIBIDO usar palabras técnicas en mensajes, banners, respuestas y resúmenes de solución (ej. prohibido: *bugs, payloads, roadmap, refactors, endpoints, DDL, varchar, PostgreSQL, chunks, PRs*).
  - Usar siempre lenguaje claro de ventas y usabilidad: *catálogo, productos, prendas, fotos, pedidos, clientes, subida de Excel, velocidad de la tienda*.
- **Filtro de Alcance de Ticket (Soporte vs. Rediseño Mayor):**
  - Los tickets de soporte son para dudas operativas, errores de carga o ajustes puntuales de la tienda.
  - Si un usuario pide un rediseño completo (ej. *"hazme mi tienda idéntica a Temu"*), NO implementarlo como un bug; responderle con calidez y cercanía en el hilo del ticket explicando que la idea quedó anotada para las próximas actualizaciones de la plataforma.
- **Dos compuertas de aprobación humana obligatorias:**
  - **Compuerta 1 (Pre-código):** Presentar diagnóstico del ticket y esperar aprobación explícita del usuario antes de tocar código.
  - **Compuerta 2 (Post-solución):** Presentar la solución técnica y verificación antes de cualquier commit o push.
- **Commit y Push condicionados:** NUNCA hacer commit ni push hasta que el usuario haya aprobado la solución terminada.
- **Seguridad en Git:** Jamás commitear secretos (`.env.local`, `.mcp.json`).

## Decision Gates

| Fase | Acción | Gate |
| --- | --- | --- |
| 1. Diagnóstico | Seleccionar 1 ticket abierto, inspeccionar captura webp y evaluar si es un ajuste puntual o una solicitud de rediseño mayor. | **STOP: Esperar aprobación del usuario.** |
| 2. Implementación | Tras aprobación, modificar código/responder hilo con lenguaje comercial y verificar con `tsc --noEmit` y `npm run build`. | Continuar a reporte de solución. |
| 3. Revisión de Solución | Explicar detalladamente cómo se solucionó y mostrar que compila en verde. | **STOP: Esperar aprobación del usuario.** |
| 4. Cierre y Entrega | Tras aprobación: marcar `resolved` o `in_progress` en Supabase con resumen amigable, `npm run bump`, `git commit` y `git push`. | Confirmar y consultar si se avanza al siguiente ticket. |

## Execution Steps

### Paso 1: Diagnóstico (1 Ticket a la vez)
1. Consultar `support_tickets` en Supabase (`status = 'open'`).
2. Seleccionar el ticket más prioritario o antiguo.
3. Descargar la captura webp a `/tmp/` e inspeccionarla con `read`.
4. Evaluar el alcance:
   - Si es un ajuste puntual o error de carga: preparar plan de fix.
   - Si es una solicitud de rediseño gigante: preparar respuesta comercial y empática para el hilo de discusión.
5. Presentar al usuario:
   - Número de ticket, remitente y mensaje textual.
   - Diagnóstico claro y plan propuesto.
6. **PAUSAR Y ESPERAR:** Preguntar "¿Apruebas este diagnóstico y plan para proceder?".

### Paso 2: Implementación & Verificación
*(Solo tras recibir la aprobación del Paso 1)*
1. Realizar las modificaciones en frontend, backend o base de datos.
2. Asegurar que cualquier texto nuevo visible al cliente use lenguaje de ventas y comercio.
3. Ejecutar `./node_modules/.bin/tsc --noEmit`.
4. Ejecutar `npm run build`.

### Paso 3: Presentación de la Solución
1. Explicar claramente al usuario:
   - Qué archivos se modificaron y qué se mejoró.
   - Textos redactados para el cliente.
   - Evidencia de que compila en verde (`next build`).
2. **PAUSAR Y ESPERAR:** Preguntar "¿Apruebas esta solución para hacer commit y push?".

### Paso 4: Cierre, Versionado, Commit y Push
*(Solo tras recibir la aprobación del Paso 3)*
1. Actualizar el ticket en Supabase (`status = 'resolved'` o `'in_progress'`) con `resolution_summary` en tono comercial y humano.
2. Ejecutar `npm run bump` (incrementa versión SemVer).
3. `git add` de los archivos involucrados (sin secretos).
4. `git commit -m "fix/feat: <descripción comercial> (ticket #XXXX), bump to vX.X.X"`.
5. `git push origin main`.
6. Informar commit y nueva versión, y preguntar si pasamos al siguiente ticket.

## Output Contract

- Respeto estricto del orden: Diagnóstico -> Aprobación -> Solución -> Aprobación -> Commit/Push.
- Redacción siempre orientada a vendedores de ecommerce, sin tecnicismos.
- Nunca adelantar pasos ni commitear antes de la aprobación final.
