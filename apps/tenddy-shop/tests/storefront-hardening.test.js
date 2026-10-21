/**
 * Test de verificación para blindaje de seguridad, aislamiento multi-tenant y rendimiento en storefronts
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación de Blindaje y Rendimiento en Storefronts (Landing & Catálogo)...\n');

// 1. TenantLandingView.tsx
const landingPath = fs.existsSync(path.join(__dirname, '../apps/tenddy-shop/src/components/TenantLandingView.tsx'))
  ? path.join(__dirname, '../apps/tenddy-shop/src/components/TenantLandingView.tsx')
  : path.join(__dirname, '../src/components/TenantLandingView.tsx');
const landingContent = fs.readFileSync(landingPath, 'utf8');

assert(landingContent.includes('getTotalUnits(tenant.id)'), 'FAIL: TenantLandingView debe aislar getTotalUnits con tenant.id');
assert(landingContent.includes('getTotalPackages(tenant.id)'), 'FAIL: TenantLandingView debe aislar getTotalPackages con tenant.id');
console.log('✅ 1. Aislamiento Multi-Tenant: TenantLandingView aísla el conteo de unidades y bultos por tenant.id.');

assert(landingContent.includes(".replace(/\\D/g, '')") || landingContent.includes('normalizeEcuadorPhone'), 'FAIL: TenantLandingView debe sanitizar el número de WhatsApp');
assert(landingContent.includes('noopener,noreferrer'), 'FAIL: TenantLandingView debe incluir noopener,noreferrer en window.open');
console.log('✅ 2. Seguridad en Enlaces: Sanitización de teléfonos y protección anti-reverse tabnabbing en WhatsApp.');

assert(landingContent.includes('preload="metadata"'), 'FAIL: El video de Hero debe tener preload="metadata"');
assert(landingContent.includes('displayedProducts') && landingContent.includes('setVisibleCount'),
  'FAIL: TenantLandingView debe implementar paginación progresiva para catálogos masivos');
console.log('✅ 3. Rendimiento & DOM: preload="metadata" en video y virtualización progresiva a 24 productos activas.');

// 2. TenantCatalogView.tsx
const catalogPath = fs.existsSync(path.join(__dirname, '../apps/tenddy-shop/src/components/TenantCatalogView.tsx'))
  ? path.join(__dirname, '../apps/tenddy-shop/src/components/TenantCatalogView.tsx')
  : path.join(__dirname, '../src/components/TenantCatalogView.tsx');
const catalogContent = fs.readFileSync(catalogPath, 'utf8');
assert(catalogContent.includes(".replace(/\\D/g, '')") || catalogContent.includes('normalizeEcuadorPhone'), 'FAIL: TenantCatalogView debe sanitizar el número de WhatsApp');
console.log('✅ 4. Modo Directo: TenantCatalogView con sanitización de números telefónicos verificada.');

console.log('\n🎉 TODAS LAS VERIFICACIONES DE HARDENING PASARON EXITOSAMENTE (100%)');
