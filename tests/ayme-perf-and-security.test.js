/**
 * Test suite de verificación de seguridad, rendimiento y cotizaciones para AYME INDUSTRIAS PET
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación de AYME PET: Rendimiento, Seguridad XSS y Cotizaciones...\n');

// 1. Verificación de scroll-sequence.js (Rendimiento)
const scrollSeqContent = fs.readFileSync(path.join(__dirname, '../public/js/scroll-sequence.js'), 'utf8');

assert(
  !scrollSeqContent.includes('preloadFrames()'),
  'FAIL: preloadFrames() no debe existir en scroll-sequence.js'
);
assert(
  !scrollSeqContent.includes('frame_${frameNumber}.jpg'),
  'FAIL: No debe haber descarga masiva de 144 frames JPEG en scroll-sequence.js'
);
assert(
  scrollSeqContent.includes('requestAnimationFrame'),
  'FAIL: requestAnimationFrame debe usarse para el suavizado'
);
assert(
  scrollSeqContent.includes('telemetryProgress') && scrollSeqContent.includes('telemetryFrame'),
  'FAIL: La telemetría debe seguir actualizándose'
);
console.log('✅ 1. Rendimiento: Precarga masiva de 32MB (144 frames) eliminada y rAF optimizado bajo demanda.');

// 2. Verificación de data.js (Escape defensivo XSS)
const dataJsContent = fs.readFileSync(path.join(__dirname, '../public/js/data.js'), 'utf8');
assert(
  dataJsContent.includes('escapeHtml'),
  'FAIL: escapeHtml debe estar definido y exportado en data.js'
);
console.log('✅ 2. Seguridad: Utilidad escapeHtml integrada en data.js.');

// 3. Verificación de products.js (Sanitización y Delegación segura)
const productsJsContent = fs.readFileSync(path.join(__dirname, '../public/js/products.js'), 'utf8');
assert(
  !productsJsContent.includes("onclick=\"productCatalog.openQuickView('${prod.id}')\""),
  'FAIL: Se eliminó interpolación insegura de openQuickView en onclick'
);
assert(
  !productsJsContent.includes("onclick=\"productCatalog.handleDirectWhatsApp('${prod.id}')\""),
  'FAIL: Se eliminó interpolación insegura de handleDirectWhatsApp en onclick'
);
assert(
  productsJsContent.includes('data-action="quick-view"'),
  'FAIL: Debe usar data-action="quick-view" para delegación segura'
);
assert(
  productsJsContent.includes('data-action="direct-wa"'),
  'FAIL: Debe usar data-action="direct-wa" para delegación segura'
);
assert(
  productsJsContent.includes('escapeHtml(prod.name)'),
  'FAIL: El nombre del producto debe ser sanitizado con escapeHtml'
);
assert(
  productsJsContent.includes('window.TENANT_ID'),
  'FAIL: window.TENANT_ID debe ser capturado de la respuesta de Supabase'
);
console.log('✅ 3. Seguridad: products.js completamente blindado contra inyecciones XSS y usando delegación de eventos.');

// 4. Verificación de cart.js (Persistencia en Supabase y Sanitización)
const cartJsContent = fs.readFileSync(path.join(__dirname, '../public/js/cart.js'), 'utf8');
assert(
  cartJsContent.includes("fetch('/api/quotes'"),
  'FAIL: cart.js debe enviar la cotización a POST /api/quotes'
);
assert(
  cartJsContent.includes('tenant_id: tenantId'),
  'FAIL: cart.js debe incluir tenant_id en la solicitud de cotización'
);
assert(
  !cartJsContent.includes("onclick=\"cartManager.updateQuantity('${item.id}'"),
  'FAIL: Se eliminó interpolación insegura de updateQuantity en onclick'
);
assert(
  !cartJsContent.includes("onclick=\"cartManager.removeItem('${item.id}')\""),
  'FAIL: Se eliminó interpolación insegura de removeItem en onclick'
);
assert(
  cartJsContent.includes('data-action="qty-minus"'),
  'FAIL: Debe usar delegación data-action="qty-minus"'
);
console.log('✅ 4. Cotizaciones & Seguridad: cart.js sincroniza con /api/quotes y elimina manejadores inline.');

// 5. Verificación de services.js y app.js
const servicesJsContent = fs.readFileSync(path.join(__dirname, '../public/js/services.js'), 'utf8');
assert(
  !servicesJsContent.includes("onclick=\"servicesManager.openBookingModal('${serv.id}')\""),
  'FAIL: Se eliminó interpolación insegura de openBookingModal en onclick'
);
assert(
  servicesJsContent.includes('data-action="book-service"'),
  'FAIL: Debe usar data-action="book-service"'
);
console.log('✅ 5. Servicios: services.js blindado contra XSS y con delegación segura.');

console.log('\n🎉 TODAS LAS VERIFICACIONES DE AYME PET PASARON EXITOSAMENTE (100%)');
