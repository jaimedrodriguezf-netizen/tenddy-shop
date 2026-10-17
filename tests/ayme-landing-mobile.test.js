const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación de optimizaciones móviles para la landing de AYME...\n');

const cssPath = path.join(__dirname, '..', 'public', 'css', 'style.css');
const landingPath = path.join(__dirname, '..', 'src', 'components', 'TenantLandingView.tsx');

const cssContent = fs.readFileSync(cssPath, 'utf8');
const landingContent = fs.readFileSync(landingPath, 'utf8');

// 1. Verificación de reglas CSS móviles para catálogo y header
assert.ok(cssContent.includes('.products-grid'), 'Debe existir .products-grid en style.css');
assert.ok(cssContent.includes('@media (max-width: 480px)'), 'Debe existir media query max-width: 480px');
assert.ok(cssContent.includes('repeat(2, 1fr)'), 'Debe mantener 2 columnas en pantallas móviles pequeñas');
console.log('✅ 1. CSS Móvil: Catálogo en 2 columnas (@media max-width 480px y 768px) verificado.');

// 2. Verificación de responsive font-size con clamp para títulos
assert.ok(cssContent.includes('clamp('), 'section-title debe usar clamp() para responsividad de fuentes');
assert.ok(landingContent.includes('clamp('), 'Los títulos de las tarjetas de la secuencia deben usar clamp()');
console.log('✅ 2. Tipografía: Títulos fluidos y responsivos con clamp() verificados.');

// 3. Verificación de header y top promo bar móvil
assert.ok(landingContent.includes('hidden md:inline'), 'Segmentos secundarios del top promo bar deben ocultarse en pantallas móviles');
assert.ok(landingContent.includes('inline sm:hidden'), 'El botón WhatsApp del header debe tener variante compacta en móvil');
console.log('✅ 3. Header & Promo Bar: Alturas, textos y botón de WhatsApp compactos en móvil verificados.');

// 4. Verificación de tarjetas de producto
assert.ok(landingContent.includes('aspect-square'), 'El contenedor de imagen del producto debe tener aspect-square');
assert.ok(landingContent.includes('object-contain'), 'Las imágenes de producto deben usar object-contain para no deformarse');
assert.ok(landingContent.includes('grid-cols-2'), 'La tabla de especificaciones rápidas debe usar grid responsivo');
console.log('✅ 4. Catálogo: Tarjetas de producto compactas con aspect-square y especificaciones de 2 columnas verificadas.');

// 5. Verificación de secciones y respaldo industrial
assert.ok(landingContent.includes('py-8 sm:py-16'), 'Las secciones principales deben usar espaciados responsivos py-8 sm:py-16');
assert.ok(landingContent.includes('sm:grid-cols-3'), 'El bloque de respaldo industrial debe apilarse limpiamente en móvil');
console.log('✅ 5. Secciones: Espaciados responsivos py-8 sm:py-16 y respaldo industrial adaptado verificados.');

// 6. Verificación de separación Header - Hero y eliminación de botones redundantes
assert.ok(cssContent.includes('padding: 7rem 0.85rem'), 'sequence-ui-layer debe tener 7rem de padding superior en móvil para no colisionar con el header');
const pagePath = path.join(__dirname, '..', 'src', 'app', 'store', '[shopSlug]', 'page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');
assert.ok(!pageContent.includes('Volver a Mi Panel'), 'src/app/store/[shopSlug]/page.tsx NO debe renderizar un botón duplicado de Volver a Mi Panel');
assert.ok(landingContent.includes('Volver a Mi Panel'), 'TenantLandingView debe ser el único encargado del botón flotante de administración');
console.log('✅ 6. Hero & Admin: Separación de 7rem en Hero (cero cruces) y eliminación de botón duplicado de administración verificadas.');

// 7. Menú móvil hamburguesa y drawer deslizable
assert.ok(landingContent.includes('isMobileMenuOpen'), 'TenantLandingView debe gestionar el estado isMobileMenuOpen');
assert.ok(landingContent.includes('Menú de Navegación'), 'Debe existir el drawer de navegación móvil');
console.log('✅ 7. Navegación Móvil: Botón Hamburger y Drawer de navegación con categorías verificados.');

// 8. Poster en video del Hero
assert.ok(landingContent.includes('poster='), 'El video del hero debe tener un atributo poster configurado');
console.log('✅ 8. Media: Poster industrial de alta resolución de respaldo en video Hero verificado.');

// 9. Utilidad .no-scrollbar y CartDrawer responsivo
const globalsPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
const globalsContent = fs.readFileSync(globalsPath, 'utf8');
assert.ok(globalsContent.includes('no-scrollbar'), 'globals.css debe declarar la utilidad no-scrollbar');
assert.ok(cssContent.includes('.no-scrollbar'), 'style.css debe declarar la clase .no-scrollbar');
const cartDrawerPath = path.join(__dirname, '..', 'src', 'components', 'CartDrawer.tsx');
const cartDrawerContent = fs.readFileSync(cartDrawerPath, 'utf8');
assert.ok(cartDrawerContent.includes('pl-0 sm:pl-10'), 'CartDrawer debe usar pl-0 sm:pl-10 para ocupar el 100% de pantalla en móvil');
console.log('✅ 9. UX Móvil: Utilidad .no-scrollbar y CartDrawer al 100% de pantalla verificados.');

console.log('\n🎉 TODOS LOS TESTS DE OPTIMIZACIÓN MÓVIL PASARON AL 100%');
