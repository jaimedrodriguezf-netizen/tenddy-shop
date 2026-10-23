---
name: tenddy-custom-landing
description: "Trigger: nueva landing, landing personalizada, cliente nuevo landing, landing corporativa, landing ayme, crear landing de cliente, configurar landing b2b, modular sections landing. Procedimiento y especificaciones para crear, estilizar y conectar landings personalizadas con el motor de 6 secciones modulares en Tenddy."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Activar inmediatamente cuando se requiera crear, modificar, conectar o personalizar una Landing Corporativa Dedicada para un nuevo cliente o fábrica en el ecosistema Tenddy.

Triggers clave:
- "vamos a crear una landing personalizada para [cliente]"
- "nueva landing de cliente" / "landing corporativa"
- "configurar secciones de la landing"
- "desplegar landing VIP para fábrica"
- "landing ayme" / "modular sections landing"

---

## Filosofía Arquitectónica: Motor vs Estilos del Cliente

En Tenddy, **las landings personalizadas no se programan desde cero cada vez**. 
Existe un **Motor Modular de 6 Secciones** respaldado por `src/lib/types.ts` (`LandingSectionsConfig`), persistido en la columna JSONB `tenants.landing_config.sections` de Supabase y administrable por el cliente desde su panel `/store/[slug]/admin -> Apariencia`.

Cuando llega un cliente nuevo (ej: una fábrica de plásticos, metalmecánica o alimentos):
1. **El Motor ya provee las 6 secciones funcionales.**
2. **El agente o desarrollador solo personaliza la identidad de marca**:
   - Paleta cromática (`primary_color`, `secondary_color`, `landing_bg_color`).
   - Logotipo y altura de renderizado (`logo_url`, `logo_height`).
   - Contenidos específicos y toggles ON/OFF (`sections.*.enabled`).

---

## Contratos de las 6 Secciones Modulares

Toda landing personalizada se gobierna mediante la interfaz `LandingSectionsConfig`:

### 1. `top_bar` (Barra Superior Informativa)
- `enabled: boolean` — Interruptor ON/OFF para mostrar u ocultar la barra superior.
- `text: string` — Mensaje corto de planta, alcance logístico o envíos (ej: `🏭 Planta Calderón • Envíos Paletizados a todo el Ecuador`).
- `bg_color?: string` — Color de fondo (HEX). Por defecto toma el `secondary_color` corporativo.

### 2. `header` (Cabecera Corporativa)
- `enabled: boolean` — Interruptor ON/OFF para la cabecera.
- `show_whatsapp_button: boolean` — Muestra el botón directo a WhatsApp de ventas con número normalizado de Ecuador.
- `custom_subtitle?: string` — Eslogan o línea de negocio B2B (ej: `Solutions in Packaging • B2B`).

### 3. `hero` (Portada Industrial & Telemetría)
- `enabled: boolean` — Interruptor ON/OFF para la sección de impacto.
- `badge?: string` — Distintivo superior técnico (ej: `SISTEMA: BLOW-MOLD ROTARY TURBINE • 40 BAR`).
- `title_main?: string` — Título en bloque (ej: `TECNOLOGÍA EN`).
- `title_highlight?: string` — Subtítulo resaltado con color de acento o cursiva (ej: `soplado & inyección`).
- `description?: string` — Párrafo descriptivo de capacidades y materiales (PET, PP, resinas vírgenes).
- `cta_primary_text?: string` — Texto del botón de acción principal (ej: `Solicitar Muestras & Cotización`).
- `cta_secondary_text?: string` — Texto del botón secundario (ej: `Ver Fases de Fabricación`).
- `show_telemetry?: boolean` — Interruptor ON/OFF para la tarjeta de telemetría de planta en vivo.
- `telemetry_plant_name?: string` — Nombre de planta (ej: `Planta Calderón`).
- `telemetry_status?: string` — Estado operativo (ej: `Operativa` / `En Producción`).
- `telemetry_cadence?: string` — Rendimiento o velocidad (ej: `+12.000 BPH`).
- `telemetry_material?: string` — Certificación de insumo (ej: `Resina PET 100% Virgen`).
- `telemetry_tooling?: string` — Capacidad de matricería (ej: `Diseño de Moldes 3D`).

### 4. `pillars` (Pilares de Respaldo B2B)
- `enabled: boolean` — Interruptor ON/OFF para el bloque de confianza.
- `items: Array<{ icon: string; title: string; desc: string }>` — Exactamente 3 pilares de validación industrial:
  - Pilar 1: Inocuidad, BPM o certificaciones de materia prima.
  - Pilar 2: Capacidad productiva, cadencia o tecnología de moldes CNC.
  - Pilar 3: Logística nacional, embalaje paletizado y retiro directo.

### 5. `rfq_and_map` (Cotizador Técnico & Ubicación de Planta)
- `enabled: boolean` — Interruptor ON/OFF para la sección de conversión y planta física.
- `title?: string` — Título de la solicitud (ej: `Solicitud de Cotización & Muestras`).
- `subtitle?: string` — Subtítulo de asistencia B2B.
- `show_form?: boolean` — Activa el formulario con selectores de producto y volumen que dispara mensaje preformateado a WhatsApp.
- `show_map?: boolean` — Activa el mapa embebido y horarios de retiro.
- `map_title?: string` — Título de la tarjeta de retiro (ej: `Ubicación de Planta & Retiro Directo`).
- `map_embed_url?: string` — URL iframe embed sanitizada de Google Maps.
- `schedule?: string` — Horarios de atención en planta (ej: `Lunes a Viernes: 08:00 - 17:30`).
- `email?: string` — Correo corporativo oficial de ventas.

### 6. `footer` (Pie de Página Corporativo)
- `enabled: boolean` — Interruptor ON/OFF para el cierre legal.
- `copyright_text?: string` — Texto de derechos reservados de la empresa.
- `show_powered_by?: boolean` — Muestra el distintivo de infraestructura: `Portal corporativo e infraestructura B2B impulsada por tenddy`.

---

## Procedimiento Paso a Paso: Alta de Nueva Landing para Cliente VIP

### Paso 1: Habilitar Gobernanza de Plantilla en Supabase
Para que una tienda tenga acceso a la landing personalizada y al editor de secciones, ejecutar o actualizar:
```sql
UPDATE tenants
SET theme_config = jsonb_set(
  jsonb_set(COALESCE(theme_config, '{}'::jsonb), '{store_template}', '"landing"'),
  '{custom_landing_unlocked}', 'true'
)
WHERE slug = 'nombre-cliente';
```

### Paso 2: Configurar Colores y Marca
Extraer los colores del logotipo del cliente (usando `src/lib/color-extractor.ts` o la herramienta del admin):
* `primary_color`: Tono dominante para botones y acentos (ej: `#A61C2E`).
* `secondary_color`: Tono de soporte y fondos profundos (ej: `#8C1625`).
* `landing_bg_color`: Fondo armónico oscuro (ej: `#0a1128`).

### Paso 3: Personalizar o Heredar Secciones
En el frontend, invocar `resolveLandingSections`:
```typescript
import { resolveLandingSections } from '@/lib/types';

// Siempre garantiza que existan las 6 secciones con fallbacks seguros
const sections = resolveLandingSections(tenant.landing_config?.sections, tenant.name, tenant.slug);
```

### Paso 4: Renderizado Condicional Defensivo
Cada sección en el JSX **DEBE estar protegida por su interruptor `enabled`**:
```tsx
{sections.top_bar.enabled && <TopPromoBar text={sections.top_bar.text} />}
{sections.header.enabled && <Header data={sections.header} />}
{sections.hero.enabled && <Hero data={sections.hero} />}
{sections.pillars.enabled && <Pillars items={sections.pillars.items} />}
{sections.rfq_and_map.enabled && <RfqAndMap data={sections.rfq_and_map} />}
{sections.footer.enabled && <Footer data={sections.footer} />}
```

---

## Reglas de Oro Inquebrantables

1. **Cero Pantallas en Blanco**: Si un cliente apaga una sección o deja un campo vacío, la aplicación NUNCA debe fallar ni arrojar `undefined`. La función `resolveLandingSections` provee fallbacks coherentes en todo momento.
2. **Gobernanza de Plantillas**: Clientes en plan estándar (modo Temu) ven únicamente los controles de catálogo ágil. El Editor de Secciones solo se activa para tiendas con `store_template === 'landing'`.
3. **Persistencia Unificada**: El panel de administración envía `sections` en el cuerpo de `PATCH /api/admin/appearance`. Cualquier cambio impacta inmediatamente en Supabase y revalida la caché de Next.js (`revalidatePath`).
