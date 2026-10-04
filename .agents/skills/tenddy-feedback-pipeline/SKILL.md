---
name: tenddy-feedback-pipeline
description: "Trigger: vamos a revisar los feedback, revisar feedback, revisar los tickets, siguiente ticket, resolver feedback uno por uno. Resuelve tickets de soporte de forma atómica: uno por uno, con análisis estricto de viabilidad técnica/negocio, 2 compuertas de aprobación humana, regla de cero formularios en modal y tono comercial sin tecnicismos."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.4"
---

## Activation Contract

Activar inmediatamente cuando el usuario diga "vamos a revisar los feedback", "revisar tickets", "siguiente feedback" o solicite procesar requerimientos de usuarios de tenddy-shop.

## Hard Rules

- **Cero acumulación:** NUNCA agrupar múltiples tickets. Siempre tomar exactamente **UNO** a la vez.
- **Regla de Arquitectura de Vistas (Cero Formularios en Modal):**
  - **TODO formulario de creación, edición, configuración o carga masiva DEBE ser una página o vista completa integrada en el panel.**
  - **PROHIBIDO usar modales flotantes con backdrop para formularios de datos.**
  - **Única excepción para modales:** Letreros de advertencia estrictos (confirmaciones de eliminación destructiva de productos/categorías, alertas de seguridad o visor ampliado de imagen).
- **Análisis Obligatorio de Viabilidad (Técnica y de Negocio):**
  - Sin importar si el cambio es pequeño o grande, ANTES de proponer un plan o escribir código, se DEBE analizar explícitamente su viabilidad técnica y de negocio.
  - Si un cambio NO es viable o resulta contraproducente: fundamentar claramente las razones y proponer una alternativa viable y profesional antes de tocar código.
- **Tono Comercial y Cero Jerga Técnica (Regla de Oro):**
  - Los usuarios son comerciantes, vendedores y dueños de tiendas de ecommerce, NO ingenieros de software.
  - PROHIBIDO usar palabras técnicas en mensajes, banners, respuestas y resúmenes de solución (ej. prohibido: *bugs, payloads, roadmap, refactors, endpoints, DDL, varchar, PostgreSQL, chunks, PRs*).
  - Usar siempre lenguaje claro de ventas y usabilidad: *catálogo, productos, prendas, fotos, pedidos, clientes, subida de Excel, velocidad de la tienda*.
- **Filtro de Alcance de Ticket (Soporte vs. Rediseño Mayor):**
  - Los tickets de soporte son para dudas operativas, errores de carga o ajustes puntuales de la tienda.
  - Si un usuario pide un rediseño completo (ej. *"hazme mi tienda idéntica a Temu"*), NO implementarlo como un bug; responderle con calidez y cercanía en el hilo del ticket explicando que la idea quedó anotada para las próximas actualizaciones de la plataforma.
- **Dos compuertas de aprobación humana obligatorias:**
  - **Compuerta 1 (Pre-código):** Presentar diagnóstico y análisis de viabilidad del ticket y esperar aprobación explícita del usuario antes de tocar código.
  - **Compuerta 2 (Post-solución):** Presentar la solución técnica y verificación antes de cualquier commit o push.
- **Commit y Push condicionados:** NUNCA hacer commit ni push hasta que el usuario haya aprobado la solución terminada.
- **Seguridad en Git:** Jamás commitear secretos (`.env.local`, `.mcp.json`).

## Decision Gates

| Fase | Acción | Gate |
| --- | --- | --- |
| 1. Diagnóstico & Viabilidad | Seleccionar 1 ticket abierto, inspeccionar captura webp y realizar el análisis estricto de viabilidad técnica y de negocio. Validar que la solución use vistas/páginas completas (sin modales para formularios). | **STOP: Esperar aprobación del usuario.** |
| 2. Implementación | Tras aprobación, modificar código/responder hilo con lenguaje comercial y verificar con `tsc --noEmit` y `npm run build`. | Continuar a reporte de solución. |
| 3. Revisión de Solución | Explicar detalladamente cómo se solucionó y mostrar que compila en verde. | **STOP: Esperar aprobación del usuario.** |
| 4. Cierre y Entrega | Tras aprobación: marcar `resolved` o `in_progress` en Supabase con resumen amigable, `npm run bump`, `git commit` y `git push`. | Confirmar y consultar si se avanza al siguiente ticket. |

## Execution Steps

### Paso 1: Diagnóstico & Viabilidad (1 Ticket a la vez)
1. Consultar `support_tickets` en Supabase (`status = 'open'`).
2. Seleccionar el ticket más prioritario o antiguo.
3. Descargar la captura webp a `/tmp/` e inspeccionarla con `read`.
4. **Análisis Obligatorio de Viabilidad:**
   - **Viabilidad Técnica:** Arquitectura, base de datos, performance, cumplimiento de regla de páginas completas (cero modales para formularios).
   - **Viabilidad de Negocio:** Impacto en ventas del comerciante y experiencia de compra.
   - **Veredicto:** ¿Es viable ejecutarlo tal como se pide, conviene ajustar el enfoque, o se debe responder en el hilo con una alternativa?
5. Presentar al usuario:
   - Número de ticket, remitente y mensaje textual.
   - Análisis de viabilidad técnica y de negocio.
   - Plan técnico o propuesta de respuesta recomendada.
6. **PAUSAR Y ESPERAR:** Preguntar "¿Apruebas este diagnóstico y análisis de viabilidad para proceder?".

### Paso 2: Implementación & Verificación
*(Solo tras recibir la aprobación del Paso 1)*
1. Realizar las modificaciones en frontend, backend o base de datos.
2. Garantizar que todos los formularios sean páginas/vistas completas integradas.
3. Asegurar que cualquier texto nuevo visible al cliente use lenguaje de ventas y comercio.
4. Ejecutar `./node_modules/.bin/tsc --noEmit`.
5. Ejecutar `npm run build`.

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

- Respeto estricto del orden: Diagnóstico y Viabilidad -> Aprobación -> Solución -> Aprobación -> Commit/Push.
- Cero formularios en modales (solo páginas completas integradas).
- Redacción siempre orientada a vendedores de ecommerce, sin tecnicismos.
- Nunca adelantar pasos ni commitear antes de la aprobación final.
