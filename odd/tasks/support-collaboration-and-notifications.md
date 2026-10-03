# Feature: Support Collaboration Center, Discussion Threads & Notifications

Estado: Completado y Listo para Aprobación
Fecha: 2026-10-03
Branch: main

## 1. Autorización & Alcance
- **Objetivo**: Transformar el sistema de soporte en un centro de colaboración bidireccional estilo GitHub Issues / Helpdesk con hilos de comentarios, notificaciones en vivo en el panel del tenant (campana de alertas) y un registro público y transparente de fixes ("qué se solucionó y cómo").
- **Alcance**:
  - Base de datos en Supabase:
    - Migración `0014_ticket_comments_and_notifications.sql`.
    - Tabla `ticket_comments` (`id`, `ticket_id`, `sender_type`, `sender_name`, `message`, `created_at`).
    - Columnas `unread_tenant_count`, `resolution_summary` y `fixed_in_version` en `support_tickets`.
  - Backend:
    - `GET /api/admin/support`: Obtener tickets del tenant con conteo de no leídos.
    - `POST /api/admin/support/comments`: Añadir comentarios al hilo del ticket.
    - `PATCH /api/admin/support`: Marcar ticket como leído por el tenant.
  - Frontend:
    - Componente `TenantSupportCenterModal.tsx` con 3 pestañas:
      1. **Hilos de Discusión (GitHub Issues):** Ver tickets, estado, mensajes y responder en el hilo.
      2. **Nuevo Ticket:** Formulario con banner de alcance (bugs y ajustes menores vs. roadmap de producto).
      3. **Registro de Fixes ("Qué se solucionó y cómo"):** Changelog transparente de soluciones y versiones.
    - Campanita de notificaciones en el header de `AdminDashboardView.tsx`.
  - Verificación: `tsc --noEmit`, `npm run build`.

## 2. Tareas & Evidencia de Implementación

### Tarea 1: Migración DDL en Supabase (ticket_comments)
- [x] Crear migración `0014_ticket_comments_and_notifications.sql`.
- [x] Ejecutar DDL en Supabase vía Management API y verificar constraints.
- **Evidencia**: DDL aplicado en Supabase. Tabla `ticket_comments` y columnas añadidas exitosamente.

### Tarea 2: Backend de Hilos de Discusión y Notificaciones
- [x] Endpoints `/api/admin/support` y `/api/admin/support/comments`.
- **Evidencia**: Rutas creadas con verificación de autorización y conteo de no leídos.

### Tarea 3: Componente Centro de Soporte Interactivo (`TenantSupportCenterModal.tsx`)
- [x] Interfaz con hilos de discusión, formulario guiado y changelog de fixes.
- **Evidencia**: `TenantSupportCenterModal.tsx` creado y probado.

### Tarea 4: Campanita de Notificaciones en `AdminDashboardView.tsx`
- [x] Integrar icono de campana con contador no leído y modal sincronizado.
- **Evidencia**: `AdminDashboardView.tsx` actualizado con `Bell` interactivo en header y sidebar.

### Tarea 5: Verificación estricta de compilación y pruebas
- [x] `tsc --noEmit` (0 errores).
- [x] `npm run lint` (0 errores).
- [x] `npm run build` en verde (28 rutas compiladas en 7.8s).
- [x] Respuesta oficial enviada al ticket #4487 y resúmenes de fixes cargados en Supabase.
- **Evidencia**: Build y pruebas en vivo exitosas.
