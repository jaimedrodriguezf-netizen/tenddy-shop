# Feature: Modern ERP Sidebar Accordion Navigation

Estado: Completado y Verificado
Fecha: 2026-10-03
Branch: main

## 1. Autorización & Alcance
- **Objetivo**: Rediseñar la navegación lateral (sidebar desktop y drawer móvil) del panel administrativo adoptando una arquitectura de menús desplegables / acordeón (tipo ERP / Contifico), preservando 100% el tema visual corporativo actual (slate/white moderno).
- **Origen**: Tickets de soporte #6418 (Menú desplegable acordeón), #2849 (Despliegue hacia abajo en Cotización y Pedido) y #3737 (Equipo y Roles en perfil/configuración).
- **Restricción**: Conservar el tema, colores, tipografía y estilo visual existente.
- **Alcance**:
  - Estado de secciones acordeón colapsables/desplegables (`isInventoryOpen`, `isQuotesOpen`).
  - Menú **Inventario ▾**:
    - Catálogo de Productos (con contador dinámico).
    - Carga Masiva (Excel / CSV) (disparador directo de modal).
    - Nueva Categoría (disparador directo de modal).
  - Menú **Cotizaciones & Pedidos ▾** (Ticket #2849):
    - Todas las Solicitudes.
    - Por Atender (con badge ámbar de conteo pendiente).
    - Aprobadas / Cerradas.
  - Reubicación de **Equipo & Asesores (Roles)** (Ticket #3737):
    - Extraído del panel principal plano y ubicado en la sección de Perfil / Configuración de Cuenta.
  - Sincronización desktop y mobile drawer.

## 2. Tareas & Evidencia de Implementación

### Tarea 1: Arquitectura de estado y menús acordeón en `AdminDashboardView.tsx`
- [x] Definir estados para acordeones y sincronizar con `activeTab` y `filterStatus`.
- [x] Construir componentes de item padre colapsable con chevron animado (`ChevronDown` con rotación suave).
- **Evidencia**: Estados `isInventoryOpen` y `isQuotesOpen` integrados y preservando paleta slate/white corporativa.

### Tarea 2: Implementación de submenús de Inventario y Cotizaciones
- [x] Submenú de Inventario con accesos a Catálogo, Carga Masiva y Categorías.
- [x] Submenú de Cotizaciones con filtro directo (Todas, Por Atender, Aprobadas).
- **Evidencia**: Cumple explícitamente el ticket #2849 y la estructura de referencia de Contifico (#6418).

### Tarea 3: Reubicación de Equipo & Roles a Perfil / Configuración
- [x] Mover Equipo & Asesores a la sección de Configuración de Perfil en la parte inferior del menú de navegación.
- **Evidencia**: Cumple con el ticket #3737 dejando limpio el panel principal de operaciones.

### Tarea 4: Verificación visual, TypeScript y Build
- [x] `./node_modules/.bin/tsc --noEmit` en verde (0 errores).
- [x] `npm run lint` en verde (0 errores).
- [x] `npm run build` completado exitosamente en 6.0s (26 rutas).
- **Evidencia**: Build y tipado estricto verificados.
