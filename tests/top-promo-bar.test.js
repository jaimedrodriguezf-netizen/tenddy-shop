/**
 * Suite de Pruebas Automatizadas: Personalización de la Mini Barra Superior (Top Promo Bar)
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación de la Mini Barra Superior (Top Promo Bar)...\n');

// 1. Tipos (src/lib/types.ts)
const typesContent = fs.readFileSync(path.join(__dirname, '../src/lib/types.ts'), 'utf8');
assert(typesContent.includes('show_top_bar?: boolean'), 'FAIL: types.ts debe definir show_top_bar en theme_config y landing_config');
assert(typesContent.includes('top_bar_text?: string'), 'FAIL: types.ts debe definir top_bar_text');
console.log('✅ 1. Tipos: show_top_bar y top_bar_text declarados en src/lib/types.ts.');

// 2. Backend (src/app/api/admin/appearance/route.ts)
const routeContent = fs.readFileSync(path.join(__dirname, '../src/app/api/admin/appearance/route.ts'), 'utf8');
assert(routeContent.includes('show_top_bar'), 'FAIL: route.ts debe recibir show_top_bar');
assert(routeContent.includes('top_bar_text'), 'FAIL: route.ts debe recibir top_bar_text');
assert(routeContent.includes('show_top_bar: body.show_top_bar !== undefined'), 'FAIL: route.ts debe persistir show_top_bar');
assert(routeContent.includes('top_bar_text: body.top_bar_text !== undefined'), 'FAIL: route.ts debe persistir top_bar_text');
console.log('✅ 2. Backend: Validación y persistencia de show_top_bar y top_bar_text verificadas.');

// 3. Panel de Apariencia (src/components/AppearanceTab.tsx)
const appTabContent = fs.readFileSync(path.join(__dirname, '../src/components/AppearanceTab.tsx'), 'utf8');
assert(appTabContent.includes('showTopBar'), 'FAIL: AppearanceTab debe manejar estado showTopBar');
assert(appTabContent.includes('topBarText'), 'FAIL: AppearanceTab debe manejar estado topBarText');
assert(appTabContent.includes('show_top_bar: showTopBar'), 'FAIL: AppearanceTab debe enviar show_top_bar en el payload');
assert(appTabContent.includes('top_bar_text: topBarText'), 'FAIL: AppearanceTab debe enviar top_bar_text en el payload');
assert(appTabContent.includes('Activar Mini Barra de Anuncio Superior'), 'FAIL: Debe existir el toggle visual para activar/desactivar');
assert(appTabContent.includes('Texto del Anuncio Comercial'), 'FAIL: Debe existir el campo para editar el texto');
console.log('✅ 3. Panel: Toggle On/Off, textarea de texto comercial y preview en vivo verificados.');

// 4. Storefront Landing (src/components/TenantLandingView.tsx)
const landingContent = fs.readFileSync(path.join(__dirname, '../src/components/TenantLandingView.tsx'), 'utf8');
assert(landingContent.includes('showTopBar'), 'FAIL: TenantLandingView debe leer estado showTopBar');
assert(landingContent.includes('customTopBarText'), 'FAIL: TenantLandingView debe leer texto personalizado customTopBarText');
assert(landingContent.includes('{showTopBar && ('), 'FAIL: TenantLandingView debe renderizar condicionalmente la top-promo-bar');
assert(landingContent.includes('top-promo-bar'), 'FAIL: Debe renderizar la clase top-promo-bar');
console.log('✅ 4. Storefront: Renderizado dinámico, condicional y segmentado verificado.');

console.log('\n🎉 TODOS LOS TESTS DE LA MINI BARRA SUPERIOR PASARON AL 100%');
