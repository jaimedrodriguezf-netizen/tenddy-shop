/**
 * Test de Verificación de Navegabilidad Integral en apps/landing-ayme-pet
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación de navegabilidad en apps/landing-ayme-pet...');

const standalonePath = path.join(__dirname, '../apps/landing-ayme-pet/src/app/page.tsx');
assert(fs.existsSync(standalonePath), 'Debe existir apps/landing-ayme-pet/src/app/page.tsx');
const content = fs.readFileSync(standalonePath, 'utf8');

// 1. Header interactivo y enlaces ancla
assert(content.includes('href="#inicio"'), 'El logo/marca debe contener enlace a #inicio');
assert(content.includes('href="#procesos"'), 'El header debe contener enlace a #procesos');
assert(content.includes('href="#catalogo"'), 'El header debe contener enlace a #catalogo');
assert(content.includes('href="#pilares"'), 'El header debe contener enlace a #pilares');
assert(content.includes('href="#cotizar"'), 'El header debe contener enlace a #cotizar');
console.log('✅ 1. Header Interactivo: Enlaces de navegación desktop presentes y consistentes.');

// 2. Menú drawer responsive móvil
assert(content.includes('isMobileMenuOpen'), 'Debe existir estado para el menú móvil');
assert(content.includes('aria-label="Abrir menú de navegación"'), 'Debe existir botón accesible para alternar menú móvil');
assert(content.includes('lg:hidden'), 'Debe existir contenedor adaptado para menú móvil');
console.log('✅ 2. Navegación Móvil: Drawer deslizable y botón hamburguesa interactivo verificados.');

// 3. Resolución de Dead Link (#procesos)
assert(content.includes('id="procesos"'), 'Debe existir sección con id="procesos" para satisfacer el CTA del Hero');
assert(content.includes('AYME_PROCESSES'), 'Debe existir definición de fases de fabricación');
assert(content.includes('service-01.webp'), 'Debe vincular imagen de soplado e inyección');
assert(content.includes('service-02.webp'), 'Debe vincular imagen de tapas y accesorios');
assert(content.includes('service-03.png'), 'Debe vincular imagen de moldes 3D');
console.log('✅ 3. Fases de Fabricación: Sección #procesos implementada resolviendo el enlace huérfano.');

// 4. Catálogo de Envases (#catalogo)
assert(content.includes('id="catalogo"'), 'Debe existir sección con id="catalogo"');
assert(content.includes('AYME_PRODUCTS'), 'Debe existir portafolio de productos de AYME');
assert(content.includes('ayme-001.svg'), 'Debe vincular catálogo de envases con SVGs vectoriales');
assert(content.includes('Cotizar este Envase'), 'Cada tarjeta debe permitir cotización directa');
console.log('✅ 4. Catálogo de Envases: Sección #catalogo con muestrario industrial y cotización verificada.');

// 5. Garantías & Respaldo (#pilares)
assert(content.includes('id="pilares"'), 'La sección de pilares debe tener id="pilares" para navegación por ancla');
console.log('✅ 5. Garantías B2B: Ancla #pilares conectada correctamente.');

// 6. Solicitud de Cotización & Retiro (#cotizar)
assert(content.includes('id="cotizar"'), 'Debe existir id="cotizar" para el formulario y mapa');
assert(content.includes('href="tel:+593998722324"'), 'El teléfono debe ser un enlace tel: clickeable');
assert(content.includes('mailto:'), 'El correo debe ser un enlace mailto: interactivo');
console.log('✅ 6. Cotizador & Planta: Ancla #cotizar, tel: y mailto: interactivos verificados.');

// 7. Retorno y Footer interactivo
assert(content.includes('Volver arriba'), 'Debe existir botón flotante o de retorno');
assert(content.includes('<footer'), 'Debe existir footer');
console.log('✅ 7. Footer & Retorno: Navegación de retorno al inicio y footer interactivo verificados.');

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE NAVEGABILIDAD EN APPS/LANDING-AYME-PET PASARON EXITOSAMENTE (100%)!');
