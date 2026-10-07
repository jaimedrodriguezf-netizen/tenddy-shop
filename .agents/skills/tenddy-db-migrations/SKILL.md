---
name: tenddy-db-migrations
description: "Trigger: vamos a hacer una migracion, migrar base de datos, nueva tabla, nueva columna, cambiar esquema, crear migracion, aplicar migracion, db migration. Gestiona y sincroniza cambios de esquema en PostgreSQL/Supabase con idempotencia estricta, compatibilidad hacia atrás en Next.js y checklist para instancias dedicadas."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Activar inmediatamente cuando el usuario o la tarea requiera modificar, agregar o eliminar tablas, columnas, funciones, triggers, índices o políticas RLS en la base de datos de Supabase/PostgreSQL de tenddy-shop.

Triggers clave:
- "vamos a hacer una migración"
- "migrar base de datos" / "nueva tabla" / "nueva columna"
- "cambiar esquema de BD"
- "crear migración" / "aplicar migración"
- "db migration" / "sincronizar bases de datos"

---

## Hard Rules (Reglas de Oro Inquebrantables)

1. **Idempotencia Absoluta (Regla 10x):**
   - Todo script SQL DEBE poder ejecutarse 10 veces consecutivas sin arrojar error ni duplicar estructuras:
     - Tablas: `CREATE TABLE IF NOT EXISTS ...`
     - Columnas: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
     - Índices: `CREATE INDEX IF NOT EXISTS ...`
     - Constraints / Enums: Encapsulados en bloques `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` o verificaciones de `pg_constraint`.
     - Políticas RLS: `DROP POLICY IF EXISTS ...; CREATE POLICY ...`

2. **Compatibilidad Hacia Atrás en Código (Anti-Breakage):**
   - El código TypeScript/Next.js **JAMÁS debe asumir** que todas las bases de datos tienen la migración aplicada al mismo milisegundo.
   - Las consultas deben ser defensivas: usar valores por defecto (`p.discount_price ?? null`), `COALESCE` en SQL, y manejo de errores con fallback para evitar errores 500 (`PGRST204: column does not exist`) en instancias donde el código se desplegó antes de correr el SQL.

3. **Inmutabilidad y Nomenclatura Canónica:**
   - Cada migración se guarda como un archivo inmutable en `supabase/migrations/NNNN_nombre_descriptivo.sql`.
   - NNNN es un secuencial de 4 dígitos (ejemplo: `0015_add_discount_price_to_products.sql`).
   - PROHIBIDO modificar archivos de migraciones anteriores que ya fueron ejecutados en producción.

4. **Blindaje de Seguridad y RLS Mandatorio:**
   - Toda tabla nueva DEBE incluir obligatoriamente:
     ```sql
     ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;
     ```
   - Debe incluir políticas de aislamiento multi-tenant por `tenant_id`:
     ```sql
     CREATE POLICY "tenant_isolation" ON <tabla>
     FOR ALL TO authenticated
     USING (tenant_id = (SELECT id FROM tenants WHERE ...));
     ```
   - Revocar permisos excesivos a roles anónimos:
     ```sql
     REVOKE ALL ON <tabla> FROM anon;
     ```

5. **Matriz de Verificación Multi-Instancia (SaaS Central vs. Instancias Dedicadas):**
   - Toda migración debe documentar su estado en la matriz de instancias:
     - [ ] **Instancia Central Tenddy SaaS** (`ref: jtqjvfvzyysfvvsqzirj`)
     - [ ] **Instancias Dedicadas VIP** (ej: AYME INDUSTRIAS PET y clientes independientes)
   - Antes de dar por completada la tarea, se debe confirmar su aplicación o dejar el checklist explícito para el despliegue del cliente.

6. **Compuerta de Aprobación Humana Obligatoria:**
   - NUNCA ejecutar scripts DDL destructivos ni insertar migraciones a ciegas.
   - Se debe presentar el archivo `.sql` completo al usuario explicando qué hace, por qué es idempotente y cómo protege el código, esperando su confirmación.

---

## Decision Gates

| Fase | Acción | Gate |
| :--- | :--- | :--- |
| **1. Diseño DDL & Idempotencia** | Redactar el archivo `supabase/migrations/NNNN_nombre.sql` garantizando cláusulas `IF NOT EXISTS` y políticas RLS. | Continuar a revisión técnica. |
| **2. Compatibilidad en Código** | Revisar los archivos de TypeScript (`types.ts`, consultas Supabase) para asegurar fallbacks y tolerancia a desfases. | Continuar a compuerta de aprobación. |
| **3. Presentación & Validación** | Mostrar el script SQL completo y la matriz de instancias a actualizar. | **STOP: Esperar aprobación explícita del usuario.** |
| **4. Ejecución & Registro** | Aplicar el script en Supabase mediante el Management API / MCP o en el Editor SQL de Supabase. | Confirmar éxito y matriz completada. |
| **5. Cierre & Versionado** | Actualizar `package.json` (`npm run bump`), registrar en memoria Engram y commitear. | Listo para `git push`. |

---

## Plantilla Canónica de Migración SQL

```sql
-- ==========================================================
-- Migración: 0015_nombre_del_cambio.sql
-- Propósito: Describir qué funcionalidad habilita
-- Idempotencia: 100% garantizada
-- ==========================================================

-- 1. Estructura de tablas / columnas
CREATE TABLE IF NOT EXISTS public.ejemplo_tabla (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_ejemplo_tenant ON public.ejemplo_tabla(tenant_id);

-- 3. Blindaje RLS
ALTER TABLE public.ejemplo_tabla ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.ejemplo_tabla;
CREATE POLICY "tenant_isolation_policy" ON public.ejemplo_tabla
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT id FROM public.tenants WHERE id = ejemplo_tabla.tenant_id));

-- 4. Triggers de actualización
DROP TRIGGER IF EXISTS update_ejemplo_modtime ON public.ejemplo_tabla;
CREATE TRIGGER update_ejemplo_modtime
    BEFORE UPDATE ON public.ejemplo_tabla
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
```

---

## Checklist de Cierre

Antes de finalizar una sesión donde se tocó la base de datos:
1. ¿El archivo `.sql` está guardado en `supabase/migrations/`?
2. ¿Se ejecutó y probó en la base de datos principal?
3. ¿El código en `src/` compila con `npm run build` sin advertencias de tipos?
4. ¿Se registró la observación de arquitectura en la memoria persistente (`mem_save`)?
