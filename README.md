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
