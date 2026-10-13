/**
 * Test de verificación del Modal / Ficha Técnica Marketplace en AYME PET (standalone.html)
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación del Modal Marketplace en AYME PET (products.js & style.css)...\n');

const productsJsContent = fs.readFileSync(path.join(__dirname, '../public/js/products.js'), 'utf8');
const styleCssContent = fs.readFileSync(path.join(__dirname, '../public/css/style.css'), 'utf8');

// 1. Breadcrumb en openQuickView
assert(productsJsContent.includes('marketplace-breadcrumb') && productsJsContent.includes('Hogar y cocina') && productsJsContent.includes('Cristalería y copas'),
  'FAIL: openQuickView debe incluir el breadcrumb jerárquico');
console.log('✅ 1. Breadcrumb jerárquico presente en openQuickView.');

// 2. Precios y Countdown
assert(productsJsContent.includes('$3.14') && productsJsContent.includes('$5.99') && productsJsContent.includes('47% DE DESCUENTO tiempo limitado'),
  'FAIL: openQuickView debe incluir el bloque de precios con descuento');
assert(productsJsContent.includes('CASI AGOTADO(S)'), 'FAIL: Debe incluir badge de urgencia CASI AGOTADO(S)');
assert(productsJsContent.includes('modal-countdown') && productsJsContent.includes('18:06:33:22'),
  'FAIL: Debe incluir temporizador de cuenta regresiva de oferta');
console.log('✅ 2. Precios rebajados y temporizador dinámico 18:06:33:22 activos.');

// 3. Logística y Transportistas
assert(productsJsContent.includes('A domicilio') && productsJsContent.includes('Envío gratis para este artículo'),
  'FAIL: openQuickView debe incluir tarjeta de envío a domicilio');
assert(productsJsContent.includes('FAR International') && productsJsContent.includes('LAARCOURIER') && productsJsContent.includes('URBANO ENVÍOS'),
  'FAIL: Debe incluir transportistas autorizados');
assert(productsJsContent.includes('Pagos seguros') && productsJsContent.includes('Privacidad segura') && productsJsContent.includes('Garantía de pedidos'),
  'FAIL: Debe incluir sellos de garantía y seguridad');
console.log('✅ 3. Logística, transportistas oficiales y sellos de confianza integrados.');

// 4. Vendedor WL damai / AYME PET
assert(productsJsContent.includes('WL damai • AYME INDUSTRIAS PET') && productsJsContent.includes('83K+'),
  'FAIL: openQuickView debe incluir tarjeta de vendedor WL damai');
console.log('✅ 4. Tarjeta de vendedor (WL damai / AYME PET) integrada.');

// 5. Muro de Reseñas Verificadas
assert(productsJsContent.includes('843 reseñas • ★ 4,8') && productsJsContent.includes('Todas las reseñas son de compras verificadas'),
  'FAIL: openQuickView debe incluir cabecera de reseñas verificadas');
assert(productsJsContent.includes('98***28') && productsJsContent.includes('Lissett') && productsJsContent.includes('ruben alvarez') && productsJsContent.includes('Ndeer Hp'),
  'FAIL: Debe listar las reseñas de compras verificadas solicitadas');
console.log('✅ 5. Muro de reseñas de clientes verificadas activo.');

// 6. Estilos CSS
assert(styleCssContent.includes('.marketplace-modal') && styleCssContent.includes('.marketplace-pricing-box') && styleCssContent.includes('.marketplace-reviews-section'),
  'FAIL: style.css debe incluir las clases del modal marketplace');
console.log('✅ 6. Estilos CSS adaptados para modal expandido tipo marketplace.');

console.log('\n🎉 TODAS LAS VERIFICACIONES DEL MODAL MARKETPLACE EN AYME PET PASARON EXITOSAMENTE (100%)');
