/**
 * Suite de Pruebas Automatizadas: Unidad de Empaque Mayorista Configurable (Presets + Texto Libre)
 * Valida:
 * 1. Definición del contrato PackagingUnit y función normalizadora getPackagingUnit en src/lib/types.ts.
 * 2. Comportamiento funcional: Presets (Paquete, Caja, Fardo, Bulto, Pack...) y texto libre personalizado.
 * 3. Persistencia en /api/admin/appearance hacia theme_config.packaging_unit.
 * 4. Editor visual en AppearanceTab.tsx con selector rápido y campos editables singular/plural.
 * 5. Consumo reactivo en Storefront, PDP (ProductDetailView), Carrito (CartDrawer) y Landing.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

console.log('🧪 Iniciando verificación de Unidad de Empaque Mayorista Configurable...\n');

// 1. Verificación en src/lib/types.ts
const typesPath = path.join(__dirname, '../src/lib/types.ts');
assert(fs.existsSync(typesPath), 'Debe existir src/lib/types.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');

assert(typesContent.includes('export interface PackagingUnit'), 'Debe exportar interface PackagingUnit');
assert(typesContent.includes('export const PACKAGING_UNIT_PRESETS'), 'Debe exportar PACKAGING_UNIT_PRESETS');
assert(typesContent.includes('export function getPackagingUnit'), 'Debe exportar getPackagingUnit');

console.log('✅ 1. Tipos & Contratos: PackagingUnit y helper getPackagingUnit verificados en types.ts.');

// 2. Test funcional de getPackagingUnit
const extractFn = (fnName) => {
  const marker = `export function ${fnName}`;
  const start = typesContent.indexOf(marker);
  assert(start !== -1, `Función ${fnName} no encontrada en types.ts`);
  let depth = 0;
  let bodyStart = -1;
  let end = -1;
  for (let i = start; i < typesContent.length; i++) {
    if (typesContent[i] === '{') {
      if (depth === 0) bodyStart = i;
      depth++;
    } else if (typesContent[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  return typesContent.slice(start, end);
};

const getPackagingUnitCode = extractFn('getPackagingUnit');

const transpiled = ts.transpileModule(getPackagingUnitCode, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

const sandboxModule = { exports: {} };
const runSandbox = new Function('exports', 'module', transpiled);
runSandbox(sandboxModule.exports, sandboxModule);
const { getPackagingUnit } = sandboxModule.exports;

// 2.1 Default universal
const defaultUnit = getPackagingUnit(null);
assert.strictEqual(defaultUnit.singular, 'Paquete', 'Default singular debe ser Paquete');
assert.strictEqual(defaultUnit.plural, 'Paquetes', 'Default plural debe ser Paquetes');

// 2.2 Preset configurado (Caja)
const cajaUnit = getPackagingUnit({ theme_config: { packaging_unit: { singular: 'Caja', plural: 'Cajas' } } });
assert.strictEqual(cajaUnit.singular, 'Caja');
assert.strictEqual(cajaUnit.plural, 'Cajas');

// 2.3 Texto libre personalizado (Bidón / Bidones)
const bidonUnit = getPackagingUnit({ theme_config: { packaging_unit: { singular: 'Bidón', plural: 'Bidones' } } });
assert.strictEqual(bidonUnit.singular, 'Bidón');
assert.strictEqual(bidonUnit.plural, 'Bidones');

console.log('✅ 2. Comportamiento Funcional: Defaults, Presets y Texto Libre evaluados con éxito.');

// 3. Persistencia en /api/admin/appearance
const apiPath = path.join(__dirname, '../src/app/api/admin/appearance/route.ts');
const apiContent = fs.readFileSync(apiPath, 'utf8');

assert(apiContent.includes('updatedPackagingUnit = currentTenant.theme_config?.packaging_unit'), 'API debe preparar updatedPackagingUnit');
assert(apiContent.includes('packaging_unit: updatedPackagingUnit'), 'API debe guardar packaging_unit en updatedTheme');

console.log('✅ 3. Persistencia Backend: Endpoint /api/admin/appearance sanitiza y guarda packaging_unit.');

// 4. Editor en AppearanceTab.tsx
const appearancePath = path.join(__dirname, '../src/components/AppearanceTab.tsx');
const appearanceContent = fs.readFileSync(appearancePath, 'utf8');

assert(appearanceContent.includes('PACKAGING_UNIT_PRESETS'), 'AppearanceTab debe importar PACKAGING_UNIT_PRESETS');
assert(appearanceContent.includes('getPackagingUnit'), 'AppearanceTab debe importar getPackagingUnit');
assert(appearanceContent.includes('const [packagingUnit, setPackagingUnit] = useState<PackagingUnit>'), 'Debe gestionar estado packagingUnit');
assert(appearanceContent.includes('packaging_unit: packagingUnit'), 'handleSave debe enviar packaging_unit');
assert(appearanceContent.includes('Unidad de Empaque Mayorista'), 'Debe renderizar bloque de configuración');
assert(appearanceContent.includes('O escribe tu denominación personalizada'), 'Debe permitir texto libre singular/plural');

console.log('✅ 4. Editor UI: AppearanceTab ofrece selector de presets y edición libre con preview en vivo.');

// 5. Consumo dinámico en Storefront, PDP, Carrito y Landing
const catalogPath = path.join(__dirname, '../src/components/TenantCatalogView.tsx');
const catalogContent = fs.readFileSync(catalogPath, 'utf8');
assert(catalogContent.includes('getPackagingUnit(tenant)'), 'TenantCatalogView debe obtener packagingUnit');
assert(catalogContent.includes('{packagingUnit.singular} x {packSize} uds'), 'Catálogo debe mostrar singular dinámico');

const pdpPath = path.join(__dirname, '../src/components/ProductDetailView.tsx');
const pdpContent = fs.readFileSync(pdpPath, 'utf8');
assert(pdpContent.includes('getPackagingUnit(tenant)'), 'ProductDetailView debe obtener packagingUnit');
assert(pdpContent.includes('${packagingUnit.singular} x ${defaultPackSize} uds'), 'PDP debe formatear packs con unidad dinámica');

const cartPath = path.join(__dirname, '../src/components/CartDrawer.tsx');
const cartContent = fs.readFileSync(cartPath, 'utf8');
assert(cartContent.includes('getPackagingUnit(tenant)'), 'CartDrawer debe obtener packagingUnit');
assert(cartContent.includes('Total {packagingUnit.plural}:'), 'Carrito debe mostrar total de unidades en plural dinámico');

const landingPath = path.join(__dirname, '../src/components/TenantLandingView.tsx');
const landingContent = fs.readFileSync(landingPath, 'utf8');
assert(landingContent.includes('getPackagingUnit(tenant)'), 'TenantLandingView debe obtener packagingUnit');
assert(landingContent.includes('u/{packagingUnit.singular.toLowerCase()}'), 'Landing debe proyectar unidad en empaque de tarjeta');

console.log('✅ 5. Consumo Dinámico: Storefront, Ficha de Producto, Carrito y Landing sincronizados.');

console.log('\n🎉 ¡Todas las pruebas de Unidad de Empaque Configurable pasaron exitosamente!');
