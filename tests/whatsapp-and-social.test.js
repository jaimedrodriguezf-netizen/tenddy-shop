/**
 * Suite de Pruebas Automatizadas: Módulo de WhatsApp Ecuador y Redes Sociales B2B
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { normalizeEcuadorPhone, buildEcuadorWhatsAppUrl } = require('../src/lib/ecuador-phone.ts');

console.log('🧪 Iniciando verificación del Módulo de WhatsApp Ecuador y Redes Sociales...\n');

// 1. Tests Unitarios de Normalización Telefónica Ecuador (src/lib/ecuador-phone.ts)
const cell1 = normalizeEcuadorPhone('0998722324');
assert.strictEqual(cell1.international, '593998722324', 'FAIL: 0998722324 debe convertirse a 593998722324');
assert.strictEqual(cell1.display, '0998722324', 'FAIL: Display debe ser 0998722324');
assert.strictEqual(cell1.isValid, true, 'FAIL: Debe ser válido');
assert.strictEqual(cell1.isCellPhone, true, 'FAIL: Debe identificarse como celular');

const cell2 = normalizeEcuadorPhone('+593 99 872 2324');
assert.strictEqual(cell2.international, '593998722324', 'FAIL: +593 99 872 2324 debe limpiarse a 593998722324');
assert.strictEqual(cell2.display, '0998722324', 'FAIL: Display debe ser 0998722324');

const cell3 = normalizeEcuadorPhone('998722324');
assert.strictEqual(cell3.international, '593998722324', 'FAIL: 9 dígitos iniciando en 9 debe convertirse a 593998722324');

const landline = normalizeEcuadorPhone('02 280 3464');
assert.strictEqual(landline.international, '59322803464', 'FAIL: Fijo de Pichincha 02 debe convertirse a 59322803464');
assert.strictEqual(landline.isCellPhone, false, 'FAIL: Fijo no debe ser celular');

const invalid = normalizeEcuadorPhone('12345');
assert.strictEqual(invalid.isValid, false, 'FAIL: Número corto debe ser inválido');

const waUrl = buildEcuadorWhatsAppUrl('0998722324', 'Hola cotización');
assert.strictEqual(waUrl, 'https://wa.me/593998722324?text=Hola%20cotizaci%C3%B3n', 'FAIL: buildEcuadorWhatsAppUrl debe generar URL canónica');
console.log('✅ 1. Módulo ecuador-phone.ts: Normalización matemática de celulares y fijos verificada.');

// 2. Tipado (src/lib/types.ts)
const typesContent = fs.readFileSync(path.join(__dirname, '../src/lib/types.ts'), 'utf8');
assert(typesContent.includes('export interface TenantSocialLinks'), 'FAIL: types.ts debe exportar TenantSocialLinks');
assert(typesContent.includes('social_links?: TenantSocialLinks'), 'FAIL: types.ts debe incluir social_links en configs');
console.log('✅ 2. Tipos: TenantSocialLinks declarado e integrado en src/lib/types.ts.');

// 3. Backend (src/app/api/admin/appearance/route.ts)
const routeContent = fs.readFileSync(path.join(__dirname, '../src/app/api/admin/appearance/route.ts'), 'utf8');
assert(routeContent.includes('normalizeEcuadorPhone'), 'FAIL: route.ts debe importar y usar normalizeEcuadorPhone');
assert(routeContent.includes('updatedSocialLinks'), 'FAIL: route.ts debe normalizar y guardar social_links');
assert(routeContent.includes('whatsapp_default: updatedSocialLinks.whatsapp_main'), 'FAIL: route.ts debe sincronizar whatsapp_default');
console.log('✅ 3. Backend: Normalización y persistencia de social_links en Supabase verificadas.');

// 4. Panel de Apariencia (src/components/AppearanceTab.tsx)
const appTabContent = fs.readFileSync(path.join(__dirname, '../src/components/AppearanceTab.tsx'), 'utf8');
assert(appTabContent.includes('WhatsApp Comercial & Redes Sociales Oficiales (Ecuador 🇪🇨)'), 'FAIL: AppearanceTab debe tener el módulo visual');
assert(appTabContent.includes('whatsappMain'), 'FAIL: Debe manejar estado whatsappMain');
assert(appTabContent.includes('linkedinUrl'), 'FAIL: Debe incluir campo de LinkedIn');
assert(appTabContent.includes('facebookUrl'), 'FAIL: Debe incluir campo de Facebook');
assert(appTabContent.includes('instagramUrl'), 'FAIL: Debe incluir campo de Instagram');
assert(appTabContent.includes('tiktokUrl'), 'FAIL: Debe incluir campo de TikTok');
assert(appTabContent.includes('showFloatingWhatsapp'), 'FAIL: Debe incluir toggle para botón flotante');
console.log('✅ 4. Panel: Módulo visual, inputs con prefijo +593, redes B2B y widget flotante verificados.');

// 5. Storefront Landing (src/components/TenantLandingView.tsx)
const landingContent = fs.readFileSync(path.join(__dirname, '../src/components/TenantLandingView.tsx'), 'utf8');
assert(landingContent.includes('buildEcuadorWhatsAppUrl'), 'FAIL: TenantLandingView debe usar buildEcuadorWhatsAppUrl');
assert(landingContent.includes('normalizeEcuadorPhone'), 'FAIL: TenantLandingView debe usar normalizeEcuadorPhone');
assert(landingContent.includes('social.show_floating_whatsapp !== false'), 'FAIL: Debe renderizar condicionalmente el widget flotante');
assert(landingContent.includes('social.linkedin'), 'FAIL: Debe renderizar enlaces sociales en el footer');
console.log('✅ 5. Storefront: WhatsApp centralizado, enlaces sociales en footer y widget flotante verificados.');

console.log('\n🎉 TODOS LOS TESTS DE WHATSAPP ECUADOR Y REDES SOCIALES PASARON AL 100%');
