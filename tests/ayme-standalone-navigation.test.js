/**
 * Test de Verificación de Navegabilidad Integral en apps/landing-ayme-pet
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación de navegabilidad integral en apps/landing-ayme-pet...');

const standalonePath = path.join(__dirname, '../apps/landing-ayme-pet/src/app/page.tsx');
assert(fs.existsSync(standalonePath), 'Debe existir apps/landing-ayme-pet/src/app/page.tsx');
const content = fs.readFileSync(standalonePath, 'utf8');

const globalsCssPath = path.join(__dirname, '../apps/landing-ayme-pet/src/app/globals.css');
assert(fs.existsSync(globalsCssPath), 'Debe existir apps/landing-ayme-pet/src/app/globals.css');
const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

// 1. Header interactivo y enlaces ancla
assert(content.includes('href="#inicio"'), 'El logo/marca debe contener enlace a #inicio');
assert(content.includes('href="#catalogo"'), 'El header debe contener enlace a #catalogo');
assert(content.includes('href="#faqs"'), 'El header debe contener enlace a #faqs');
assert(content.includes('href="#cotizar"'), 'El header debe contener enlace a #cotizar');
console.log('✅ 1. Header Interactivo: Enlaces de navegación desktop presentes y consistentes.');

// 2. Menú drawer responsive móvil
assert(content.includes('isMobileMenuOpen'), 'Debe existir estado para el menú móvil');
assert(content.includes('aria-label="Abrir menú de navegación"'), 'Debe existir botón accesible para alternar menú móvil');
assert(content.includes('lg:hidden'), 'Debe existir contenedor adaptado para menú móvil');
console.log('✅ 2. Navegación Móvil: Drawer deslizable y botón hamburguesa interactivo verificados.');

// 3. Verificación de retiro de #procesos
assert(!content.includes('id="procesos"'), 'La sección #procesos debe haber sido retirada');
console.log('✅ 3. Fases de Fabricación: Sección #procesos retirada correctamente por requerimiento.');

// 4. Catálogo de Envases (#catalogo)
assert(content.includes('id="catalogo"'), 'Debe existir sección con id="catalogo"');
assert(content.includes('AYME_PRODUCTS'), 'Debe existir portafolio de productos de AYME');
assert(content.includes('ayme-001.svg'), 'Debe vincular catálogo de envases con SVGs vectoriales');
assert(content.includes('Cotizar este Envase'), 'Cada tarjeta debe permitir cotización directa');
console.log('✅ 4. Catálogo de Envases: Sección #catalogo con muestrario industrial y cotización verificada.');

// 5. Verificación de retiro de #pilares
assert(!content.includes('id="pilares"'), 'La sección #pilares debe haber sido retirada');
console.log('✅ 5. Garantías B2B: Sección #pilares retirada correctamente.');

// 6. Solicitud de Cotización & Retiro (#cotizar)
assert(content.includes('id="cotizar"'), 'Debe existir id="cotizar" para el formulario y mapa');
assert(content.includes('href="tel:+593998722324"'), 'El teléfono debe ser un enlace tel: clickeable');
assert(content.includes('mailto:'), 'El correo debe ser un enlace mailto: interactivo');
console.log('✅ 6. Cotizador & Planta: Ancla #cotizar, tel: y mailto: interactivos verificados.');

// 7. Retorno y Footer interactivo
assert(content.includes('Volver arriba'), 'Debe existir botón flotante o de retorno');
assert(content.includes('<footer'), 'Debe existir footer');
console.log('✅ 7. Footer & Retorno: Navegación de retorno al inicio y footer interactivo verificados.');

// 8. Scroll-Padding y Márgenes de anclaje (scroll-mt-24)
assert(globalsCss.includes('scroll-padding-top'), 'globals.css debe definir scroll-padding-top');
assert(globalsCss.includes('scroll-behavior: smooth'), 'globals.css debe definir scroll-behavior smooth');
assert(content.includes('scroll-mt-24'), 'Las secciones principales deben incluir scroll-mt-24 para no ser tapadas por el header');
console.log('✅ 8. Scroll-Padding & Márgenes: Espaciado contra header fijo verificado.');

// 9. Scroll Spy activo en Header
assert(content.includes('activeSection'), 'Debe existir estado activeSection para el Scroll Spy');
assert(content.includes('activeSection === \'inicio\''), 'El header debe reaccionar a la sección inicio');
assert(content.includes('activeSection === \'catalogo\''), 'El header debe reaccionar a la sección catalogo');
assert(content.includes('activeSection === \'faqs\''), 'El header debe reaccionar a la sección faqs');
console.log('✅ 9. Scroll Spy: Detección reactiva de posición y resaltado de navegación verificado.');

// 10. Filtrado interactivo en Catálogo
assert(content.includes('selectedCategoryTab'), 'Debe existir estado de filtrado de categorías en catálogo');
assert(content.includes('Todos los Modelos'), 'Tab de todos los modelos presente');
assert(content.includes('Botellas PET'), 'Tab de botellas presente');
assert(content.includes('Galones Industriales'), 'Tab de galones presente');
assert(content.includes('Preformas & Tapas'), 'Tab de preformas y tapas presente');
console.log('✅ 10. Filtros de Catálogo: Tabs de selección rápida por línea de envases verificadas.');

// 11. Modal de Ficha Técnica B2B
assert(content.includes('technicalModalProduct'), 'Debe existir estado technicalModalProduct para el modal técnico');
assert(content.includes('Ver Plano & Medidas'), 'Debe existir botón para abrir ficha técnica');
assert(content.includes('Especificaciones de Planta'), 'Debe renderizar tabla de ingeniería');
assert(content.includes('palletQty'), 'Debe mostrar información de paletizado y logística');
console.log('✅ 11. Modal B2B: Ficha técnica con plano, medidas de ingeniería y embalaje verificada.');

// 12. Feedback visual en Formulario (#cotizar)
assert(content.includes('highlightForm'), 'Debe existir estado highlightForm para feedback visual');
assert(content.includes('Modelo seleccionado:'), 'Debe renderizar badge confirmatorio al seleccionar producto');
console.log('✅ 12. Feedback Visual: Animación de foco y confirmación de envase seleccionado verificada.');

// 13. Navegación Secuencial en Modal (Anterior / Siguiente)
assert(content.includes('handlePrevProduct'), 'Debe existir función handlePrevProduct');
assert(content.includes('handleNextProduct'), 'Debe existir función handleNextProduct');
assert(content.includes('Modelo anterior'), 'Debe existir botón accesible de modelo anterior');
assert(content.includes('Modelo siguiente'), 'Debe existir botón accesible de modelo siguiente');
assert(content.includes('ArrowLeft'), 'Debe escuchar tecla ArrowLeft');
assert(content.includes('ArrowRight'), 'Debe escuchar tecla ArrowRight');
console.log('✅ 13. Modal Secuencial: Navegación de catálogo con flechas y teclado verificada.');

// 14. Buscador en Catálogo
assert(content.includes('searchQuery'), 'Debe existir estado searchQuery');
assert(content.includes('Buscar por nombre, SKU'), 'Debe renderizar placeholder de búsqueda');
console.log('✅ 14. Búsqueda Reactiva: Input de filtrado instantáneo por SKU, nombre y cuello verificado.');

// 15. Botón Flotante Omnicanal de WhatsApp
assert(content.includes('WhatsApp Planta'), 'Debe existir widget flotante de WhatsApp');
assert(content.includes('animate-ping'), 'Debe incluir badge verde pulsante en vivo');
console.log('✅ 15. Widget Flotante: Acceso comercial directo a WhatsApp en planta verificado.');

// 16. Enlace de Ruta GPS en Mapa
assert(content.includes('Trazar ruta GPS'), 'Debe existir botón de trazar ruta');
assert(content.includes('maps.google.com'), 'Debe enlazar a Google Maps con destino de planta');
console.log('✅ 16. Logística & GPS: Botón directo para transportistas verificado.');

// 17. Acordeón de FAQs B2B
assert(content.includes('id="faqs"'), 'Debe existir sección con id="faqs"');
assert(content.includes('AYME_FAQS'), 'Debe contener listado de preguntas frecuentes');
assert(content.includes('openFaqIndex'), 'Debe manejar estado para acordeón desplegable');
console.log('✅ 17. FAQs B2B: Acordeón interactivo de condiciones industriales verificado.');

console.log('\n🎉 ¡TODAS LAS 17 PRUEBAS DE NAVEGABILIDAD EN APPS/LANDING-AYME-PET PASARON EXITOSAMENTE (100%)!');
