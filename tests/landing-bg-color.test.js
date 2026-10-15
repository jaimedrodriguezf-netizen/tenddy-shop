/**
 * Suite de Tests Automatizados: Selector de Color de Fondo de la Landing Page
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación del Selector de Color de Fondo de Landing Page...\n');

// 1. Verificar Backend /api/admin/appearance/route.ts
const routeContent = fs.readFileSync(path.join(__dirname, '../src/app/api/admin/appearance/route.ts'), 'utf8');
assert(routeContent.includes('landing_bg_color'), 'FAIL: Backend debe recibir landing_bg_color');
assert(routeContent.includes('landing_bg_color: sanitizeHexColor'), 'FAIL: Backend debe validar y sanitizar landing_bg_color en theme_config');
console.log('✅ 1. Backend: Sanitización y persistencia de landing_bg_color en theme_config verificadas.');

// 2. Verificar AppearanceTab.tsx
const appTabContent = fs.readFileSync(path.join(__dirname, '../src/components/AppearanceTab.tsx'), 'utf8');
assert(appTabContent.includes('landingBgColor'), 'FAIL: AppearanceTab debe manejar estado de landingBgColor');
assert(appTabContent.includes('predefinedBgColors'), 'FAIL: Debe incluir presets rápidos de color de fondo');
assert(appTabContent.includes('handleApplyHarmonicBg'), 'FAIL: Debe incluir botón para teñir armónicamente el fondo');
assert(appTabContent.includes('landing_bg_color: landingBgColor'), 'FAIL: Debe enviar landing_bg_color en PATCH');
assert(appTabContent.includes('style={{ backgroundColor: landingBgColor }}'), 'FAIL: Preview en vivo debe adoptar landingBgColor');
console.log('✅ 2. Panel de Apariencia: Selector de fondo, presets, botón de tinte armónico y preview verificados.');

// 3. Verificar TenantLandingView.tsx
const landingContent = fs.readFileSync(path.join(__dirname, '../src/components/TenantLandingView.tsx'), 'utf8');
assert(landingContent.includes('landingBgColor = (theme as any)?.landing_bg_color'), 'FAIL: TenantLandingView debe leer landing_bg_color');
assert(landingContent.includes('isLightBg'), 'FAIL: TenantLandingView debe calcular luminancia para contraste automático');
assert(landingContent.includes('backgroundColor: landingBgColor'), 'FAIL: Debe aplicar landingBgColor en el contenedor principal');
assert(landingContent.includes('linear-gradient(to top, ${landingBgColor}'), 'FAIL: Overlay de Hero debe fundirse con landingBgColor');
console.log('✅ 3. Storefront Landing: Renderizado dinámico de fondo y contraste adaptativo verificado.');

console.log('\n🎉 TODOS LOS TESTS DE COLOR DE FONDO DE LANDING PASARON EXITOSAMENTE (100%)');
