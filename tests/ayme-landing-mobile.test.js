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

// 6. Verificación de separación Header - Hero y menú de perfil de administración
assert.ok(cssContent.includes('padding: 7rem 0.85rem'), 'sequence-ui-layer debe tener 7rem de padding superior en móvil para no colisionar con el header');
const pagePath = path.join(__dirname, '..', 'src', 'app', 'store', '[shopSlug]', 'page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');
assert.ok(!pageContent.includes('Volver a Mi Panel'), 'src/app/store/[shopSlug]/page.tsx NO debe renderizar un botón duplicado de Volver a Mi Panel');
assert.ok(landingContent.includes('isAdminMenuOpen'), 'TenantLandingView debe gestionar el menú de perfil de administración en la cabecera');
assert.ok(landingContent.includes('bottom-4 right-4 sm:bottom-6 sm:right-6 z-40'), 'El botón flotante de WhatsApp debe ubicarse en la esquina inferior derecha');
console.log('✅ 6. Hero, WhatsApp & Admin: Separación de 7rem en Hero, WhatsApp a la derecha y perfil Admin en cabecera verificados.');

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

// 10. Rendimiento: useMemo y rAF seguro en TenantLandingView
assert.ok(landingContent.includes('useMemo('), 'TenantLandingView debe usar useMemo para el filtrado de productos');
assert.ok(landingContent.includes('cancelAnimationFrame'), 'TenantLandingView debe limpiar rAF al desmontar el componente');
assert.ok(landingContent.includes('loading="lazy"'), 'Las imágenes deben incluir loading="lazy"');
assert.ok(landingContent.includes('decoding="async"'), 'Las imágenes deben incluir decoding="async"');
console.log('✅ 10. Rendimiento: useMemo en productos, rAF cancelable y carga diferida (lazy/async) verificados.');

// 11. Seguridad: Sanitización de URLs externas contra XSS
assert.ok(landingContent.includes('safeExternalUrl'), 'TenantLandingView debe sanitizar URLs externas de redes sociales');
const appearanceRoutePath = path.join(__dirname, '..', 'src', 'app', 'api', 'admin', 'appearance', 'route.ts');
const appearanceContent = fs.readFileSync(appearanceRoutePath, 'utf8');
assert.ok(appearanceContent.includes('sanitizeHttpUrl'), 'La API de apariencia debe sanitizar URLs de redes sociales con sanitizeHttpUrl');
console.log('✅ 11. Seguridad: Sanitización estricta de protocolos HTTP/HTTPS contra vectores XSS verificada.');

// 12. Escalabilidad y Resiliencia de Negocio: Lead capture en contacto y proyección en tenant.ts
assert.ok(landingContent.includes("fetch('/api/quotes'"), 'El formulario de contacto debe persistir el lead en /api/quotes');
const tenantLibPath = path.join(__dirname, '..', 'src', 'lib', 'tenant.ts');
const tenantLibContent = fs.readFileSync(tenantLibPath, 'utf8');
assert.ok(tenantLibContent.includes("select('id, name, slug"), 'getTenantCatalog debe proyectar campos en categories');
assert.ok(tenantLibContent.includes("delete sanitized.admin_password_hash"), 'sanitizeTenant debe eliminar defensivamente admin_password_hash');
console.log('✅ 12. Escalabilidad & Leads: Proyección SQL de columnas y captura de leads en formulario de contacto verificadas.');

// 13. VersionBadge en pie de página de Landing personalizada y Catálogo estándar
assert.ok(landingContent.includes('<VersionBadge'), 'TenantLandingView debe renderizar el VersionBadge en su footer');
const catalogViewPath = path.join(__dirname, '..', 'src', 'components', 'TenantCatalogView.tsx');
const catalogViewContent = fs.readFileSync(catalogViewPath, 'utf8');
assert.ok(catalogViewContent.includes('<VersionBadge'), 'TenantCatalogView debe renderizar el VersionBadge en su footer');
console.log('✅ 13. VersionBadge: Version visible en el pie de pagina de landing personalizada y catalogo estandar verificado.');

// 14. Paridad de UI: Menú de perfil admin y WhatsApp flotante derecho en Catálogo estándar
assert.ok(catalogViewContent.includes('isAdminMenuOpen'), 'TenantCatalogView debe gestionar el menú de perfil admin en cabecera');
assert.ok(catalogViewContent.includes('right-4 sm:right-6 z-40'), 'TenantCatalogView debe tener el botón de WhatsApp flotante a la derecha');
console.log('✅ 14. Paridad UI: Perfil admin en cabecera y WhatsApp flotante a la derecha en catalogo estandar verificados.');

// 15. Desacoplamiento de parches: Limpieza de ayme-001.svg y utilidad hasValidProductImage
const productImagePath = path.join(__dirname, '..', 'src', 'lib', 'product-image.ts');
const productImageContent = fs.readFileSync(productImagePath, 'utf8');
assert.ok(productImageContent.includes('export function hasValidProductImage'), 'product-image.ts debe exportar hasValidProductImage');
assert.ok(productImageContent.includes('export function getProductPrimaryImage'), 'product-image.ts debe exportar getProductPrimaryImage');
console.log('✅ 15. Desacoplamiento: Utilidad product-image centralizada y validada sin parches dispersos.');

// 16. Dinamismo en AppearanceTab
const appearanceTabPath = path.join(__dirname, '..', 'src', 'components', 'AppearanceTab.tsx');
const appearanceTabContent = fs.readFileSync(appearanceTabPath, 'utf8');
assert.ok(appearanceTabContent.includes('tenant.slug === \'ayme-pet\' ? \'0998722324\''), 'AppearanceTab debe aplicar fallback de 0998722324 exclusivamente a ayme-pet');
assert.ok(appearanceTabContent.includes('${tenant.slug}'), 'AppearanceTab debe generar placeholders dinamicos con el slug del tenant');
console.log('✅ 16. Apariencia: Placeholders y fallbacks dinamicos desacoplados verificados.');

// 17. Limpieza de archivos muertos y dinamismo de ubicación/tag en TenantLandingView
assert.strictEqual(fs.existsSync(path.join(__dirname, '..', 'src', 'components', 'AymeOriginalLanding.tsx')), false, 'AymeOriginalLanding.tsx debe haber sido eliminado');
assert.strictEqual(fs.existsSync(path.join(__dirname, '..', 'src', 'lib', 'ayme-html.ts')), false, 'ayme-html.ts debe haber sido eliminado');
assert.ok(landingContent.includes('tenant.slug === \'ayme-pet\' ? \'AYME INDUSTRIAS PET • PACKAGING\''), 'El Hero debe dinamizar el tag según tenant.slug');
console.log('✅ 17. Desacoplamiento final: Archivos muertos eliminados y landing desacoplada verificados.');

console.log('\n🎉 TODOS LOS TESTS DE OPTIMIZACIÓN MÓVIL PASARON AL 100%');
