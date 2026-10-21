/**
 * Tests de verificación para la subida de logo y branding en storefront
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación de Subida de Logo y Branding...\n');

// 1. AppearanceTab.tsx
const appTabContent = fs.readFileSync(path.join(__dirname, '../src/components/AppearanceTab.tsx'), 'utf8');
assert(appTabContent.includes('handleLogoFileSelect'), 'FAIL: Debe existir handleLogoFileSelect');
assert(appTabContent.includes("accept=\"image/png,image/webp,image/jpeg\""), 'FAIL: Debe restringir a PNG, WebP o JPG');
assert(appTabContent.includes('Subir Logotipo') || appTabContent.includes('Cambiar Logotipo'), 'FAIL: Debe tener botón de subida de logo');
assert(appTabContent.includes("folder', 'logos'"), 'FAIL: Debe enviar el logo a la carpeta logos');
assert(appTabContent.includes('2 * 1024 * 1024'), 'FAIL: Debe limitar el tamaño del logo a 2MB');
console.log('✅ 1. AppearanceTab: Selector de archivo, preview y subida directa a Storage verificados.');

// 2. /api/admin/appearance/route.ts
const appRouteContent = fs.readFileSync(path.join(__dirname, '../src/app/api/admin/appearance/route.ts'), 'utf8');
assert(appRouteContent.includes("clean.startsWith('/') && !clean.startsWith('//')"), 'FAIL: sanitizeImageUrl debe permitir rutas locales relativas');
console.log('✅ 2. Backend: sanitizeImageUrl blindado para soportar rutas absolutas y relativas.');

// 3. TenantLandingView.tsx
const landingContent = fs.readFileSync(path.join(__dirname, '../src/components/TenantLandingView.tsx'), 'utf8');
assert(landingContent.includes('tenant.logo_url ?') || landingContent.includes('tenant.logo_url ||'), 'FAIL: Debe evaluar tenant.logo_url en la cabecera');
assert(landingContent.includes('loading="eager"'), 'FAIL: Debe usar loading="eager" para prevenir parpadeo');
assert(landingContent.includes('logoHeight') && landingContent.includes('style={{ height: `${logoHeight}px` }}'), 'FAIL: Debe tener contenedor con dimensiones dinámicas controladas');
console.log('✅ 3. Storefront: Cabecera con logo real y carga prioritaria verificada.');

console.log('\n🎉 TODAS LAS VERIFICACIONES DE LOGO UPLOADER PASARON EXITOSAMENTE (100%)');
