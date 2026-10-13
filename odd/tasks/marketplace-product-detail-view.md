# Tareas ODD: Interfaz de Producto Estilo Marketplace de Alta Conversión

## Contexto y Alcance
Modernización integral de `ProductDetailView.tsx` adaptada a la especificación de e-commerce de alto impacto (estilo Temu/Amazon/AliExpress):
1. **Hero & Precios**: Breadcrumb jerárquico (`Inicio > Categoría > Subcategoría > Producto`), título completo, precio rebajado con badge de descuento (`47% DE DESCUENTO`), temporizador de cuenta regresiva activo (`Oferta de temporada`), badge `CASI AGOTADO(S)`, métricas sociales (4.8 estrellas, 843 reseñas, 14K+ ventas).
2. **Logística & Garantías**: Tarjeta de envío a domicilio gratis con fechas estimadas de entrega, transportistas (FAR International, LAARCOURIER, URBANO ENVÍOS) y sellos de seguridad (Pagos seguros, Privacidad segura, Garantía de pedidos).
3. **Vendedor & Atributos**: Tarjeta de fabricante/vendedor con seguidores y volumen de ventas; ficha técnica de atributos (Material, Reutilizable, Forma, Medidas).
4. **Reseñas Verificadas**: Muro de comentarios con compradores verificados, calificaciones de estrellas, fechas y testimonios.

## Tareas

- [x] **Tarea 1**: Implementar Breadcrumb, Galería, Hero de Precios con Descuento y Countdown Timer en `ProductDetailView.tsx`.
- [x] **Tarea 2**: Integrar Selectores de Variantes, Tarjeta Logística de Envío y Sellos de Confianza.
- [x] **Tarea 3**: Crear Tarjeta de Vendedor, Ficha Técnica de Atributos y Muro de Reseñas Verificadas.
- [x] **Tarea 4**: Verificar compilación, linter, tests automatizados y registrar evidencias ODD.

## Evidencia de Verificación
- **Breadcrumb & Navegación**: Ruta jerárquica activa (`Inicio > Hogar y cocina > Cristalería y copas > Título`).
- **Hero de Precios & Urgencia**: Descuento calculado (`$3.14 $5.99 47% DE DESCUENTO`), badge `CASI AGOTADO(S)`, y temporizador regresivo dinámico en vivo `18:06:33:22`.
- **Logística & Garantías**: Tarjeta de envío a domicilio gratis con fechas estimadas de entrega, transportistas (FAR International, LAARCOURIER, URBANO ENVÍOS) y sellos de seguridad (Pagos seguros, Privacidad segura, Garantía de pedidos).
- **Vendedor & Atributos**: Tarjeta de vendedor (Seguidores, Ventas, Calificación) y ficha técnica con acordeón de especificaciones técnicas.
- **Muro de Reseñas**: Reseñas verificadas con compradores (`98***28`, `Lissett`, `ruben alvarez`, `Ndeer Hp`), calificaciones de estrellas, fechas y testimonios.
- **Tests & Compilación**: `tests/marketplace-product-detail.test.js` 100% superado (6/6), `tsc` y `eslint` sin errores, `next build` exitoso en 35 rutas. Versionado v1.0.106.
