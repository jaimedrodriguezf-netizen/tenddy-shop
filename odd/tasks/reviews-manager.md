# Feature: Módulo Profesional de Valoraciones de Productos

Estado: Completado y Verificado
Fecha: 2026-10-07
Branch: main
Versión: v1.0.65

## 1. Autorización & Alcance
- **Objetivo**: Implementar el módulo oficial de "Valoraciones" de productos en el panel administrativo de Tenddy Shop, permitiendo moderar, filtrar, auditar, responder y gestionar las reseñas y calificaciones de clientes por producto.
- **Alcance**:
  - Modelos y Tipos (`src/lib/types.ts`):
    - Definir `ProductReview` con campos `id`, `tenant_id`, `product_id`, `product_name`, `type`, `author_name`, `author_email`, `author_ip`, `rating`, `content`, `status` ('approved' | 'pending' | 'spam' | 'trash'), `reply`, `created_at`.
  - Backend API (`src/app/api/admin/reviews/route.ts`):
    - `GET`: Obtener valoraciones del tenant con soporte de filtrado por estado, puntuación y producto.
    - `POST`: Creación manual de valoraciones/reseñas.
    - `PATCH`: Modificación de estado (aprobar, pendiente, spam, papelera, restaurar), contenido y respuestas de la tienda.
    - `DELETE`: Borrado definitivo individual o en lote.
  - Componente Frontend (`src/components/ReviewsManagerView.tsx`):
    - Barra de estados canónica: Todas | Pendientes | Aprobadas | Spam | Papelera.
    - Selectores de filtrado: Tipo de valoración, Puntuación (1-5 estrellas), Producto específico y Búsqueda textual.
    - Acciones en lote: Aprobar, Desmarcar/Pendiente, Spam, Papelera, Restaurar, Borrar permanentemente.
    - Tabla con cabecera y pie repetidos: Checkbox Selección, Tipo (orden asc/desc), Autor (orden asc/desc), Puntuación (orden asc/desc), Valoración (con acciones rápidas hover: Aprobar/Desaprobar, Responder, Spam, Papelera), Producto (orden asc/desc), Enviada el (orden asc/desc).
    - Estado vacío: "No se encontraron valoraciones."
    - Modal de respuesta oficial y modal de añadir valoración manual.
  - Integración en Dashboard (`src/components/AdminDashboardView.tsx`):
    - Conectar la pestaña `'reviews'` en `activeTab`.
    - Activar el botón de Valoraciones en el submenú lateral de Productos con badge dinámico.
    - Renderizar la vista dentro del panel principal.

## 2. Tareas & Plan de Ejecución
- [x] 1. Definir tipos e interfaces en `src/lib/types.ts` (`ProductReview`, `ReviewStatus`, `ProductReviewReply`).
- [x] 2. Implementar endpoints API en `src/app/api/admin/reviews/route.ts` con GET, POST, PATCH y DELETE.
- [x] 3. Desarrollar el componente `src/components/ReviewsManagerView.tsx` con estados (Todas, Pendientes, Aprobadas, Spam, Papelera), filtros por tipo, puntuación y producto, ordenación ascendente/descendente en columnas, acciones rápidas hover, selección en lote, respuestas y modales.
- [x] 4. Integrar en `src/components/AdminDashboardView.tsx` bajo la pestaña `reviews` y submenú lateral de Productos con conteo dinámico.
- [x] 5. Ejecutar verificación de tipos y build de producción (`npm run build` exitoso con 32 rutas).
