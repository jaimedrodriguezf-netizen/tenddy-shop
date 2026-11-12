# Tenddy Shop - Plataforma E-commerce & Cotizador Multi-Tenant

> Sistema de comercio electrónico B2B/B2C y cotizador en línea multi-inquilino construido con Next.js 16 (App Router), React 19, TypeScript y persistencia relacional en Supabase con Row Level Security (RLS).

---

## 🎯 Visión General

**Tenddy Shop** es una solución de comercio electrónico diseñada para empresas y distribuidores que requieren gestionar catálogos masivos, cotizaciones en tiempo real y pedidos omnicanal con derivación directa a WhatsApp y almacenamiento en la nube.

Permite a múltiples negocios operar con su propia identidad de marca (storefront dedicado), carritos independientes y catálogos sincronizados mediante archivos masivos de Excel/CSV.

---

## 🚀 Características y Capacidades

### 1. Storefront Multi-Tenant y Branding Dinámico
- Identidad visual personalizada por tienda (logotipos alojados en CDN de Supabase Storage con renderizado dinámico).
- Portales independientes con aislamiento estricto de carrito y sesión por negocio.

### 2. Procesamiento Masivo de Catálogos (Excel / CSV)
- Importación y actualización masiva de productos mediante hojas de cálculo con `read-excel-file` y `PapaParse`.
- Mapeo automático de campos: SKU, nombre, descripción, precio, categoría y control de stock.

### 3. Cotizador Interactivo y Pedidos WhatsApp
- Sistema de cotización en línea con cálculo de subtotales, impuestos y descuentos en tiempo real.
- Generación de pedidos estructurados y sanitizados enviados directamente al WhatsApp del comercio para cierre inmediato de ventas.

### 4. Seguridad & Arquitectura de Datos
- Persistencia relacional en PostgreSQL bajo Supabase con políticas estrictas de **Row Level Security (RLS)**.
- Autenticación segura de administradores y comerciantes con control granular de accesos.

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 (App Router / Server Components) + React 19
- **Lenguaje:** TypeScript (tipado estricto)
- **Persistencia & CDN:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`, PostgreSQL, Supabase Storage)
- **Procesamiento de Datos:** `PapaParse`, `read-excel-file`
- **Estilos & UI:** Tailwind CSS, Lucide Icons, clsx
- **Testing:** Suite E2E automatizada (`tests/e2e-suite.js`)

---

## Portada canónica de AYME

Vista local: `http://localhost:3002/store/ayme-pet` (ruta canónica: `/store/ayme-pet`).
Solo la tienda exacta `ayme-pet` utiliza la portada automática de cuatro envases,
sin rotación ni sincronización al scroll. El botón **Pausar / Reanudar** admite
teclado; la preferencia de movimiento reducido desactiva la animación, incluso
al cambiar durante la visita. Los enlaces llevan al catálogo y contacto originales.
La opción `sections.hero.enabled` permite ocultar la portada de AYME.
Catálogo, filtros, fichas, carrito y formulario siguen usando los datos y flujos
originales; las demás tiendas conservan su portada industrial. Sin publicación.

Con la aplicación principal ejecutándose en el puerto 3002:

```bash
HERO_TEST_URL=http://localhost:3002/store/ayme-pet node tests/ayme-canonical-hero.test.js
node tests/ayme-canonical-hero-render.test.js
```

La prueba de navegador no envía formularios, cotizaciones ni mensajes y usa un
carrito aislado. Comprueba imágenes, controles, móvil, filtros, fichas y Bulto.
La prueba de renderizado comprueba aislamiento, desactivación y las secciones
originales con datos deterministas, sin crear tiendas en la base de datos.

## Tarjetas del catálogo AYME

Solo `/store/ayme-pet` usa las tarjetas con imagen completa, nombre, SKU,
especificaciones disponibles y unidades reales por empaque. **Agregar al pedido**
(icono + texto) agrega el mismo empaque al cotizador existente; **Ficha** y
**Cotizar** quedan debajo como acciones secundarias, con objetivos táctiles de
44 px. La grilla muestra cuatro columnas en escritorio y dos en móvil. No se
inventan categorías, precios ni especificaciones cuando faltan datos.

```bash
HERO_TEST_URL=http://localhost:3002/store/ayme-pet node tests/ayme-product-cards.test.js
node tests/ayme-product-cards-render.test.js
```

El navegador usa un perfil nuevo y bloquea solicitudes no GET; intercepta la
apertura de WhatsApp sin enviar mensajes ni formularios. Las categorías ausentes
en datos locales se reportan como omitidas; una fixture verifica ese filtro.
Después del build, `CARD_SCREENSHOTS=1` con el comando de navegador guarda
`.next/ayme-product-cards-desktop.png` y `.next/ayme-product-cards-mobile.png`.

## Recorrido secundario de envases AYME

Exclusivo de `/store/ayme-pet`, entre la portada y el catálogo. El desplazamiento
nativo controla cuatro escenas reversibles con texto a la izquierda en escritorio
y foto sobre texto en móvil. No reproduce video, no gira productos ni avanza solo.
El enlace al catálogo permite continuar directamente. Ventanas cortas, contenido
que no cabe y movimiento reducido muestran las cuatro escenas en flujo normal;
la preferencia puede cambiar durante la visita.

La sección usa los productos recibidos, sin consultas adicionales ni catálogo
copiado. Las fotos de oso con tapa morada y vaso estampado buscan `AYME-030` y
`AYME-042`: muestran nombre vigente, ficha real y **Agregar al pedido** mediante
el carrito existente. Si falta una referencia, queda solo la descripción visual
y consulta. El osito rojo y la botella con dispensador rojo siempre son
presentaciones descriptivas: sin capacidad, SKU, material, empaque, ficha ni
pedido asignado. **Consultar este modelo** lleva al contacto original, sin enviar
mensajes ni registrar cotizaciones. No se usan descripciones genéricas como
prueba de certificación.

```bash
HERO_TEST_URL=http://localhost:3002/store/ayme-pet node tests/ayme-scroll-showcase.test.js
node tests/ayme-scroll-showcase-render.test.js
```

Las pruebas públicas cubren orden, datos ausentes, aislamiento de tenants,
scroll reversible, geometría, acciones, móvil y cambio dinámico de movimiento
reducido. El navegador usa un perfil nuevo y bloquea solicitudes no GET y mapas;
solo modifica su carrito local aislado. Después del build, ejecutar la prueba de
navegador con `SHOWCASE_SCREENSHOTS=1` guarda
`.next/ayme-scroll-showcase-{desktop,mobile,reduced}.png`. La verificación
independiente y la comprobación compilada por Tailscale fueron aprobadas; estas
comprobaciones no autorizan publicación.

## 🧪 Pruebas y Validación

El sistema cuenta con pruebas E2E para verificar flujos críticos de compra y cotización:

```bash
# Ejecutar suite de pruebas E2E
npm run test:e2e
```

---

## 📦 Configuración y Despliegue Local

### Requisitos Previos
- Node.js >= 18
- Proyecto de Supabase activo

### 1. Clonar e instalar dependencias
```bash
git clone https://github.com/jaimedrodriguezf-netizen/tenddy-shop.git
cd tenddy-shop
npm install
```

### 2. Configurar variables de entorno (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

---

## 📄 Licencia y Autor

Desarrollado por **Ing. Jaime Daniel Rodríguez** ([jaimedrodriguezf@gmail.com](mailto:jaimedrodriguezf@gmail.com)).  
LinkedIn: [linkedin.com/in/jaime-rodriguez-981463262](https://linkedin.com/in/jaime-rodriguez-981463262) | Portafolio: [januscore.pro](https://januscore.pro)
