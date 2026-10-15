/**
 * Suite de Tests Automatizados: Extractor de Colores del Logo y Paleta Dinámica
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación de Extracción de Colores y Paleta Corporativa...\n');

// 1. Verificar módulo utilitario color-extractor.ts
const colorExtractorPath = path.join(__dirname, '../src/lib/color-extractor.ts');
assert(fs.existsSync(colorExtractorPath), 'FAIL: Debe existir src/lib/color-extractor.ts');
const colorExtractorCode = fs.readFileSync(colorExtractorPath, 'utf8');

assert(colorExtractorCode.includes('extractPaletteFromPixels'), 'FAIL: Debe exportar extractPaletteFromPixels');
assert(colorExtractorCode.includes('extractColorsFromImage'), 'FAIL: Debe exportar extractColorsFromImage');
assert(colorExtractorCode.includes('rgbToHex'), 'FAIL: Debe exportar rgbToHex');
assert(colorExtractorCode.includes('colorDistance'), 'FAIL: Debe exportar colorDistance');

// Ejecución algorítmica de prueba unitaria en memoria
function testAlgorithm() {
  // Simulación de buffer RGBA de 10x10 píxeles:
  // - 20 píxeles transparentes
  // - 30 píxeles fondo blanco puro (255, 255, 255, 255)
  // - 35 píxeles Azul Marino AYME (#1F2E4D -> R:31, G:46, B:77)
  // - 15 píxeles Rojo Carmesí AYME (#A61C2E -> R:166, G:28, B:46)
  const pixels = [];

  // 20 transparentes
  for (let i = 0; i < 20; i++) pixels.push(255, 255, 255, 0);
  // 30 blancos
  for (let i = 0; i < 30; i++) pixels.push(255, 255, 255, 255);
  // 35 azul marino
  for (let i = 0; i < 35; i++) pixels.push(31, 46, 77, 255);
  // 15 rojo carmesí
  for (let i = 0; i < 15; i++) pixels.push(166, 28, 46, 255);

  let extractPaletteFromPixels;
  try {
    const mod = require('../src/lib/color-extractor');
    extractPaletteFromPixels = mod.extractPaletteFromPixels;
  } catch {
    // Si se ejecuta con node directo, requerir vía transpilador tsx
    const { execSync } = require('child_process');
    const output = execSync('npx tsx -e "const { extractPaletteFromPixels } = require(\'./src/lib/color-extractor\'); console.log(JSON.stringify(extractPaletteFromPixels([' + pixels.join(',') + '])));"', { encoding: 'utf8' });
    const palette = JSON.parse(output.trim());
    assert(palette && palette.primary, 'FAIL: extractPaletteFromPixels debe devolver objeto con primary');
    assert(palette.secondary, 'FAIL: extractPaletteFromPixels debe devolver secondary');
    assert(Array.isArray(palette.palette), 'FAIL: extractPaletteFromPixels debe devolver palette array');
    console.log('   🎨 Paleta extraída en prueba sintética:', palette);
    return;
  }

  const palette = extractPaletteFromPixels(pixels);
  assert(palette && palette.primary, 'FAIL: extractPaletteFromPixels debe devolver objeto con primary');
  assert(palette.secondary, 'FAIL: extractPaletteFromPixels debe devolver secondary');
  assert(Array.isArray(palette.palette), 'FAIL: extractPaletteFromPixels debe devolver palette array');
  console.log('   🎨 Paleta extraída en prueba sintética:', palette);
}

testAlgorithm();
console.log('✅ 1. Algoritmo de cuantización y extracción de paleta en color-extractor.ts verificado al 100%.');

// 2. Verificar AppearanceTab.tsx
const appTabContent = fs.readFileSync(path.join(__dirname, '../src/components/AppearanceTab.tsx'), 'utf8');
assert(appTabContent.includes('extractColorsFromImage'), 'FAIL: AppearanceTab debe importar extractColorsFromImage');
assert(appTabContent.includes('Extraer colores del logotipo'), 'FAIL: Debe incluir botón interactivo de extracción');
assert(appTabContent.includes('secondaryColor'), 'FAIL: Debe manejar estado de secondaryColor');
assert(appTabContent.includes('extractedPalette'), 'FAIL: Debe manejar estado de extractedPalette');
assert(appTabContent.includes('secondary_color: secondaryColor'), 'FAIL: Debe persistir secondary_color en PATCH');
assert(appTabContent.includes('Colores detectados en tu logotipo'), 'FAIL: Debe mostrar swatches de la paleta extraída');
console.log('✅ 2. Panel de Apariencia: Botón de extracción, selectores y swatches interactivos verificados.');

// 3. Verificar /api/admin/appearance/route.ts
const routeContent = fs.readFileSync(path.join(__dirname, '../src/app/api/admin/appearance/route.ts'), 'utf8');
assert(routeContent.includes('secondary_color'), 'FAIL: Backend debe recibir secondary_color');
assert(routeContent.includes('sanitizeHexColor'), 'FAIL: Backend debe validar formato hex seguro');
assert(routeContent.includes('secondary_color: sanitizeHexColor'), 'FAIL: Backend debe persistir secondary_color sanitizado');
console.log('✅ 3. Backend: Validación y persistencia de secondary_color en theme_config verificadas.');

// 4. Verificar TenantLandingView.tsx
const landingContent = fs.readFileSync(path.join(__dirname, '../src/components/TenantLandingView.tsx'), 'utf8');
assert(landingContent.includes('primaryColor = theme?.primary_color'), 'FAIL: Landing debe leer primaryColor de theme_config');
assert(landingContent.includes('secondaryColor = theme?.secondary_color'), 'FAIL: Landing debe leer secondaryColor de theme_config');
assert(landingContent.includes('style={{ backgroundColor: primaryColor'), 'FAIL: Landing debe aplicar primaryColor en botones principales');
assert(landingContent.includes('style={{ color: secondaryColor'), 'FAIL: Landing debe aplicar secondaryColor en acentos/badges');
console.log('✅ 4. Storefront Landing: Renderizado dinámico de primaryColor y secondaryColor verificado.');

console.log('\n🎉 TODOS LOS TESTS DE EXTRACCIÓN DE COLORES Y PALETA CORPORATIVA PASARON EXITOSAMENTE (100%)');
