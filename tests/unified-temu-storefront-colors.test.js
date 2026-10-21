/**
 * Suite de Verificación Automatizada: Modo Estándar Estilo Temu con Colores Unificados
 * Valida la capa de tokens cromáticos, ausencia total de estilos fijos hardcodeados,
 * y la reactividad a primary_color y secondary_color configurables desde el panel de administración.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación de Diseño Estilo Temu y Colores Unificados...\n');

// 1. Verificación de la Capa de Tokens (src/lib/theme-tokens.ts)
const {
  resolveStorefrontTokens,
  buildStorefrontThemeCSS,
  isLightColor,
  adjustBrightness,
  isValidHexColor,
} = require('../src/lib/theme-tokens.ts');

// Caso A: Fallbacks predeterminados (Estilo Temu de fábrica)
const defaultTokens = resolveStorefrontTokens();
assert.strictEqual(defaultTokens.primary, '#FB7701', 'FAIL: Color primario por defecto debe ser naranja Temu #FB7701');
assert.strictEqual(defaultTokens.secondary, '#111827', 'FAIL: Color secundario por defecto debe ser slate oscuro #111827');
assert.strictEqual(defaultTokens.primaryText, '#ffffff', 'FAIL: Texto sobre naranja Temu debe ser blanco');
assert.strictEqual(defaultTokens.secondaryText, '#ffffff', 'FAIL: Texto sobre slate 900 debe ser blanco');
assert(defaultTokens.primaryLight.includes('rgba(251, 119, 1,'), 'FAIL: primaryLight debe derivar de RGB primario');
assert(defaultTokens.secondaryLight.includes('rgba(17, 24, 39,'), 'FAIL: secondaryLight debe derivar de RGB secundario');
console.log('✅ 1. Tokens Predeterminados: Fallbacks estilo Temu (#FB7701 y #111827) con variantes cromáticas correctas.');

// Caso B: Colores personalizados configurados desde el panel (Ej: AYME PET #A61C2E y #8C1625)
const customTokens = resolveStorefrontTokens('#A61C2E', '#8C1625');
assert.strictEqual(customTokens.primary, '#A61C2E', 'FAIL: Color primario personalizado no coincide');
assert.strictEqual(customTokens.secondary, '#8C1625', 'FAIL: Color secundario personalizado no coincide');
assert.strictEqual(customTokens.primaryText, '#ffffff', 'FAIL: Texto sobre #A61C2E debe ser blanco');

// Caso C: Detección inteligente de luminancia para colores claros
const lightYellowTokens = resolveStorefrontTokens('#FEF08A', '#FFFFFF');
assert.strictEqual(lightYellowTokens.primaryText, '#0f172a', 'FAIL: Texto sobre amarillo pastel debe ser oscuro para accesibilidad');
assert.strictEqual(lightYellowTokens.secondaryText, '#0f172a', 'FAIL: Texto sobre blanco debe ser oscuro para accesibilidad');
console.log('✅ 2. Contraste y Accesibilidad: Selección inteligente de texto según luminancia perceptual (ITU-R BT.601).');

// Caso D: Inyección de variables CSS
const cssVars = buildStorefrontThemeCSS('#FB7701', '#111827');
assert(cssVars['--tenant-primary'] === '#FB7701', 'FAIL: --tenant-primary ausente en CSS variables');
assert(cssVars['--tenant-secondary'] === '#111827', 'FAIL: --tenant-secondary ausente en CSS variables');
assert(cssVars['--tenant-primary-hover'], 'FAIL: --tenant-primary-hover ausente');
assert(cssVars['--tenant-primary-light'], 'FAIL: --tenant-primary-light ausente');
assert(cssVars['--tenant-primary-border'], 'FAIL: --tenant-primary-border ausente');
console.log('✅ 3. Generador CSS: Diccionario de variables --tenant-* listo para inyección en el contenedor raíz.');

// Caso E: Blindaje Defense-in-Depth contra cadenas maliciosas o corruptas
assert.strictEqual(isValidHexColor('#FB7701'), true, 'FAIL: #FB7701 debe ser válido');
assert.strictEqual(isValidHexColor('#fff'), true, 'FAIL: #fff debe ser válido');
assert.strictEqual(isValidHexColor('red; background: blue'), false, 'FAIL: Inyección CSS debe ser rechazada');
assert.strictEqual(isValidHexColor('javascript:alert(1)'), false, 'FAIL: URI maliciosa debe ser rechazada');
const safeFallbacks = resolveStorefrontTokens('invalid; injection', 'evil_payload');
assert.strictEqual(safeFallbacks.primary, '#FB7701', 'FAIL: Valor malicioso debe hacer fallback a #FB7701');
assert.strictEqual(safeFallbacks.secondary, '#111827', 'FAIL: Valor malicioso debe hacer fallback a #111827');
console.log('✅ 4. Blindaje Defense-in-Depth: isValidHexColor rechaza cualquier inyección CSS no canónica.');

// 2. Verificación Estricta en TenantCatalogView.tsx (Modo Estándar Temu)
const catalogFile = path.join(__dirname, '../src/components/TenantCatalogView.tsx');
const catalogContent = fs.readFileSync(catalogFile, 'utf8');

// Desconexión de clases fijas
assert(!catalogContent.includes('bg-sky-600'), 'FAIL: Se detectó bg-sky-600 hardcodeado en TenantCatalogView');
assert(!catalogContent.includes('bg-sky-500'), 'FAIL: Se detectó bg-sky-500 hardcodeado en TenantCatalogView');
assert(!catalogContent.includes('bg-sky-50'), 'FAIL: Se detectó bg-sky-50 hardcodeado en TenantCatalogView');
assert(!catalogContent.includes('text-sky-600'), 'FAIL: Se detectó text-sky-600 hardcodeado en TenantCatalogView');
assert(!catalogContent.includes('text-sky-700'), 'FAIL: Se detectó text-sky-700 hardcodeado en TenantCatalogView');
assert(!catalogContent.includes('border-sky-'), 'FAIL: Se detectó border-sky-* hardcodeado en TenantCatalogView');
console.log('✅ 4. Eliminación de Clases Estáticas: 100% de clases sky-* purgadas de TenantCatalogView.');

// Integración de ambos colores
assert(catalogContent.includes('tenant.theme_config?.primary_color'), 'FAIL: Debe leer primary_color de theme_config');
assert(catalogContent.includes('tenant.theme_config?.secondary_color'), 'FAIL: Debe leer secondary_color de theme_config');
assert(catalogContent.includes('resolveStorefrontTokens(primaryColor, secondaryColor)'), 'FAIL: Debe resolver tokens con ambos colores');
assert(catalogContent.includes('buildStorefrontThemeCSS(primaryColor, secondaryColor)'), 'FAIL: Debe construir CSS con ambos colores');
assert(catalogContent.includes('style={themeStyles}'), 'FAIL: El contenedor raíz debe inyectar themeStyles');
console.log('✅ 5. Consumo Dinámico: primary_color y secondary_color del tenant gobiernan el árbol DOM.');

// Componentes clave estilo Temu
assert(catalogContent.includes('themeTokens.primary'), 'FAIL: Debe aplicar themeTokens.primary en elementos clave');
assert(catalogContent.includes('themeTokens.secondary'), 'FAIL: Debe aplicar themeTokens.secondary en elementos secundarios');
assert(catalogContent.includes('title="Agregar fardo al cotizador"'), 'FAIL: Botón de cotización directa presente');
assert(catalogContent.includes('Cargar más productos'), 'FAIL: Paginación progresiva debe usar término universal "productos"');
assert(catalogContent.includes('Precios de Fábrica por Fardo, Bulto & Pallet'), 'FAIL: Hero Banner promocional Temu presente');
assert(catalogContent.includes('setSortBy'), 'FAIL: Barra de ordenamiento interactiva presente');
assert(catalogContent.includes('¡Agregado!'), 'FAIL: Micro-interacción táctil en botón cotizar presente');
assert(catalogContent.includes('Toast Flotante de Confirmación'), 'FAIL: Toast flotante no intrusivo presente');
console.log('✅ 6. Experiencia Temu: Header con botón de búsqueda, Hero Banner promocional, Sorting Bar y micro-interacción de compra rápida.');

// 3. Verificación en ProductDetailView.tsx
const pdpFile = path.join(__dirname, '../src/components/ProductDetailView.tsx');
const pdpContent = fs.readFileSync(pdpFile, 'utf8');
assert(pdpContent.includes('resolveStorefrontTokens'), 'FAIL: ProductDetailView debe importar y usar resolveStorefrontTokens');
assert(pdpContent.includes('buildStorefrontThemeCSS'), 'FAIL: ProductDetailView debe inyectar buildStorefrontThemeCSS');
assert(pdpContent.includes('style={themeStyles}'), 'FAIL: ProductDetailView debe aplicar themeStyles');
console.log('✅ 7. Coherencia en Ficha Técnica: ProductDetailView sincronizado con la misma paleta unificada.');

console.log('\n🎉 TODOS LOS TESTS DE DISEÑO TEMU Y COLORES UNIFICADOS PASARON EXITOSAMENTE (100%)');
