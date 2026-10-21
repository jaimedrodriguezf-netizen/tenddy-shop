# Mejoras de Diseño y Conversión Estilo Temu en Storefront Estándar
Hero Banner promocional, barra de ordenamiento ágil y micro-interacción de compra rápida en TenantCatalogView.

## Specs
- S1: "sigamos con mejoras de diseño": Implementar Hero Banner promocional de alta conversión estilo Temu con gradiente dinámico (de `primary_color` a `secondary_color`), propuesta de valor de fábrica mayorista y reloj de corte de despacho del día.
- S2: Incorporar barra de ordenamiento ágil (Sorting Bar) encima de la grilla de productos con filtros rápidos: Recomendados, Más Vendidos, Menor MOQ y Mejor Calificados.
- S3: Micro-interacción táctil al pulsar "+ Cotizar": feedback visual instantáneo en el botón (`✓ Agregado`), confirmación no intrusiva y actualización reactiva de contadores sin bloquear la navegación.
- S4: Integración 100% armónica con los tokens dinámicos `--tenant-primary` y `--tenant-secondary`, manteniendo TypeScript limpio, ESLint sin errores y suite de tests al 100%.

## Tasks
- [x] T1 (S1): Diseñar e integrar Hero Banner promocional estilo Temu con gradiente corporativo dinámico y sellos de confianza mayorista. (Commit: cc0ed5b)
- [x] T2 (S2): Implementar barra de ordenamiento reactivo (Sorting Bar) con ordenación en vivo por demanda, volumen y calificación. (Commit: cc0ed5b)
- [x] T3 (S3): Implementar micro-interacción y feedback táctil (`✓ Agregado`) en botón de cotización rápida de tarjetas de producto. (Commit: cc0ed5b)
- [x] T4 (S4): Verificar suite de tests automatizados, tsc, linter y build de producción. (Commit: cc0ed5b)

## Evidencia de Verificación
- **Hero Promo Banner Temu-Style**: Gradiente dinámico 135deg entre `--tenant-primary` y `--tenant-secondary`, sellos de Inocuidad/Calidad, empaque industrial protegido, cobertura nacional y llamado a la acción directo con asesor WhatsApp.
- **Barra de Ordenamiento y Filtros Rápidos (Sorting Bar)**: Opciones en vivo: "Recomendados", "🔥 Más Vendidos", "Menor Volumen" y "⭐ Mejor Calificados" con badges interactivos y conteo de artículos.
- **Micro-interacción de Compra Rápida**: Botón de tarjeta pasa a estado verde `✓ ¡Agregado!` durante 1.8 segundos, acompañado de un toast flotante no intrusivo con acceso directo a "Ver Carrito".
- **Pruebas Automatizadas**: `tests/unified-temu-storefront-colors.test.js` actualizado y superado al 100% (7/7). Toda la suite de regresión sin fallos.
- **Compilación & Linter**: TypeScript sin errores, ESLint 0 errores, `next build` exitoso en 35 rutas. Versionado a `v0.1.11`.

## Log
- L1: Petición del usuario: "si hazlo sigamos co  mejorqs de diseño".
