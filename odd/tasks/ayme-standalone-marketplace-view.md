# Tareas ODD: Interfaz de Producto Marketplace en Ficha Técnica de AYME PET (standalone.html)

## Contexto y Alcance
El usuario esperaba que al hacer clic en "Ver Ficha Técnica" / "Ver Plano Técnico" en la tienda principal de AYME INDUSTRIAS PET (`/store/ayme-pet` / `public/standalone.html`), la ficha técnica no sea un modal básico simple sino la interfaz rica de Marketplace completa (estilo Temu/Amazon):
1. **Breadcrumb y Hero**: `Inicio > Hogar y cocina > Cristalería y copas > Título`, precios con descuento (`$3.14 $5.99 47% DE DESCUENTO`), badge `CASI AGOTADO(S)` y temporizador activo de *Oferta de temporada* (`18:06:33:22`).
2. **Prueba Social**: 4,8 estrellas, 843 reseñas, 14K+ ventas, compras verificadas.
3. **Logística y Garantías**: Envío a domicilio gratis, fecha estimada de entrega, transportistas (FAR International, LAARCOURIER, URBANO ENVÍOS) y sellos de seguridad.
4. **Vendedor y Atributos**: Tarjeta de vendedor (WL damai / AYME INDUSTRIAS PET con seguidores y ventas), ficha técnica de atributos (Material, Reutilizable, Forma, Medidas).
5. **Muro de Reseñas Verificadas**: Reseñas de clientes reales (`98***28`, `Lissett`, `ruben alvarez`, `Ndeer Hp`).

## Tareas

- [x] **Tarea 1**: Implementar interfaz Marketplace de alta conversión en `openQuickView` (`public/js/products.js`).
- [x] **Tarea 2**: Adaptar estilos CSS en `public/css/style.css` para el modal marketplace expandido.
- [x] **Tarea 3**: Verificar con tests automatizados y registrar evidencias ODD.

## Evidencia de Verificación
- **Modal Marketplace en AYME PET**: Al pulsar "Ver Ficha Técnica" o "Ver Plano Técnico" en `/store/ayme-pet` (`standalone.html`), se despliega la interfaz de alta conversión tipo Temu/Amazon:
  - Breadcrumb jerárquico (`Inicio > Hogar y cocina > Cristalería y copas > Título`).
  - Precios con descuento (`$3.14 $5.99 47% DE DESCUENTO`), badge `CASI AGOTADO(S)` y temporizador de oferta de temporada en vivo (`18:06:33:22`).
  - Tarjeta de logística y despacho a domicilio gratis (`FAR International`, `LAARCOURIER`, `URBANO ENVÍOS`).
  - Sellos de confianza (Pagos seguros, Privacidad segura, Garantía de pedidos).
  - Tarjeta de fabricante/vendedor (`WL damai • AYME INDUSTRIAS PET` con seguidores y ventas).
  - Ficha técnica completa de atributos y dimensiones.
  - Muro de reseñas de clientes verificadas (`98***28`, `Lissett`, `ruben alvarez`, `Ndeer Hp`).
- **Tests Automatizados**: `tests/ayme-modal-marketplace.test.js` superado al 100% (6/6). Todos los tests previos pasan sin regresiones.
- **Compilación & Linter**: TypeScript limpio, 0 errores ESLint. Versión v1.0.107.
- **RDD**: Revisión aprobada y recibo quemado (`review-32d74e9e5eb7d609`).
- **Commit**: `2381932` en branch `feat/ayme-standalone-marketplace-view`.
