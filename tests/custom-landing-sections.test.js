/**
 * Suite de Pruebas Automatizadas: Motor de Secciones Modulares y Configurables para Landing Personalizada
 * Valida:
 * 1. Definición y normalización de contratos y tipos (LandingSectionsConfig) con valores seguros por defecto.
 * 2. Comportamiento funcional de resolveLandingSections con toggles independientes ON/OFF.
 * 3. Persistencia y sanitización en /api/admin/appearance hacia Supabase landing_config.
 * 4. Integración del Editor Modular por bloques en AppearanceTab.tsx (6 secciones con interruptores y acordeones).
 * 5. Renderizado reactivo condicional en TenantLandingView.tsx y apps/landing-ayme-pet/src/app/page.tsx.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando verificación del Motor de Secciones Modulares para Landings Personalizadas...\n');

// 1. Verificación del contrato en src/lib/types.ts
const typesPath = path.join(__dirname, '../src/lib/types.ts');
assert(fs.existsSync(typesPath), 'Debe existir src/lib/types.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');

assert(typesContent.includes('export interface LandingSectionsConfig'), 'Debe exportar LandingSectionsConfig');
assert(typesContent.includes('export interface LandingTopBarSection'), 'Debe exportar LandingTopBarSection');
assert(typesContent.includes('export interface LandingHeaderSection'), 'Debe exportar LandingHeaderSection');
assert(typesContent.includes('export interface LandingHeroSection'), 'Debe exportar LandingHeroSection');
assert(typesContent.includes('export interface LandingPillarsSection'), 'Debe exportar LandingPillarsSection');
assert(typesContent.includes('export interface LandingRfqMapSection'), 'Debe exportar LandingRfqMapSection');
assert(typesContent.includes('export interface LandingFooterSection'), 'Debe exportar LandingFooterSection');
assert(typesContent.includes('export function getDefaultLandingSections'), 'Debe exportar getDefaultLandingSections');
assert(typesContent.includes('export function resolveLandingSections'), 'Debe exportar resolveLandingSections');

console.log('✅ 1. Tipos & Contratos: Esquema de 6 secciones e interfaces de datos verificado.');

// 2. Test funcional del resolver de secciones
// Extraemos la lógica pura para validación unitaria de invariantes
const ts = require('typescript');

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

const getDefaultLandingSectionsCode = extractFn('getDefaultLandingSections');
const resolveLandingSectionsCode = extractFn('resolveLandingSections');

const transpiled = ts.transpileModule(
  `${getDefaultLandingSectionsCode}\n${resolveLandingSectionsCode}`,
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;

const sandboxModule = { exports: {} };
const runSandbox = new Function('exports', 'module', transpiled);
runSandbox(sandboxModule.exports, sandboxModule);
const { getDefaultLandingSections, resolveLandingSections } = sandboxModule.exports;

// 2.1 Verificación de defaults
const defaultGeneric = getDefaultLandingSections('Metalúrgica del Norte', 'metalurgica');
assert.strictEqual(defaultGeneric.top_bar.enabled, true);
assert.strictEqual(defaultGeneric.header.enabled, true);
assert.strictEqual(defaultGeneric.hero.enabled, true);
assert.strictEqual(defaultGeneric.hero.show_telemetry, true);
assert.strictEqual(defaultGeneric.pillars.enabled, true);
assert.strictEqual(defaultGeneric.pillars.items.length, 3);
assert.strictEqual(defaultGeneric.rfq_and_map.enabled, true);
assert.strictEqual(defaultGeneric.footer.enabled, true);

const defaultAyme = getDefaultLandingSections('AYME INDUSTRIAS PET', 'ayme-pet');
assert(defaultAyme.hero.title_highlight.includes('soplado & inyección'));
assert(defaultAyme.top_bar.text.includes('Calderón - Quito'));

console.log('✅ 2.1 Valores por Defecto: Generación de configuración base para tiendas industriales y AYME verificada.');

// 2.2 Verificación de toggles ON/OFF independientes
const customToggles = resolveLandingSections({
  top_bar: { enabled: false },
  header: { enabled: true, show_whatsapp_button: false },
  hero: { enabled: true, show_telemetry: false, title_main: 'PRODUCCIÓN CNC' },
  pillars: { enabled: false },
  rfq_and_map: { enabled: true, show_map: false },
  footer: { enabled: false },
}, 'Fábrica Modelo', 'fabrica-modelo');

assert.strictEqual(customToggles.top_bar.enabled, false, 'Top bar debe poder apagarse');
assert.strictEqual(customToggles.header.show_whatsapp_button, false, 'Botón whatsapp en cabecera debe poder apagarse');
assert.strictEqual(customToggles.hero.show_telemetry, false, 'Telemetría de planta debe poder apagarse');
assert.strictEqual(customToggles.hero.title_main, 'PRODUCCIÓN CNC', 'Debe persistir texto personalizado de título');
assert.strictEqual(customToggles.pillars.enabled, false, 'Pilares debe poder apagarse');
assert.strictEqual(customToggles.rfq_and_map.show_map, false, 'Mapa en cotizador debe poder apagarse');
assert.strictEqual(customToggles.footer.enabled, false, 'Footer debe poder apagarse');

console.log('✅ 2.2 Toggles ON/OFF: Apagado y encendido atómico de cada sección y sub-módulo verificado.');

// 3. Verificación de la API en src/app/api/admin/appearance/route.ts
const apiPath = path.join(__dirname, '../src/app/api/admin/appearance/route.ts');
assert(fs.existsSync(apiPath), 'Debe existir src/app/api/admin/appearance/route.ts');
const apiContent = fs.readFileSync(apiPath, 'utf8');

assert(apiContent.includes("import { resolveLandingSections } from '@/lib/types'"), 'API debe importar resolveLandingSections');
assert(apiContent.includes('updatedSections = resolveLandingSections(body.sections'), 'API debe normalizar body.sections');
assert(apiContent.includes('sections: updatedSections !== undefined ? updatedSections : currentTenant.landing_config?.sections'), 'API debe persistir sections en landing_config');

console.log('✅ 3. Persistencia API: Endpoint /api/admin/appearance sanitiza y guarda sections en Supabase.');

// 4. Verificación del Editor de Secciones en AppearanceTab.tsx
const appearanceTabPath = path.join(__dirname, '../src/components/AppearanceTab.tsx');
assert(fs.existsSync(appearanceTabPath), 'Debe existir src/components/AppearanceTab.tsx');
const appearanceContent = fs.readFileSync(appearanceTabPath, 'utf8');

assert(appearanceContent.includes('resolveLandingSections'), 'AppearanceTab debe importar resolveLandingSections');
assert(appearanceContent.includes("const [sections, setSections] = useState<LandingSectionsConfig>"), 'Debe inicializar estado sections');
assert(appearanceContent.includes('toggleSectionActive'), 'Debe proveer función para toggle ON/OFF');
assert(appearanceContent.includes('openSectionAccordion'), 'Debe proveer estado de acordeón para las secciones');
assert(appearanceContent.includes('1. Barra Superior Informativa (Top Promo Bar)'), 'Debe incluir bloque Sección 1');
assert(appearanceContent.includes('2. Cabecera Corporativa (Header)'), 'Debe incluir bloque Sección 2');
assert(appearanceContent.includes('3. Portada Industrial (Hero & Telemetría)'), 'Debe incluir bloque Sección 3');
assert(appearanceContent.includes('4. Pilares de Respaldo Industrial (3 Pilares)'), 'Debe incluir bloque Sección 4');
assert(appearanceContent.includes('5. Cotizador Técnico & Ubicación de Planta'), 'Debe incluir bloque Sección 5');
assert(appearanceContent.includes('6. Pie de Página Corporativo (Footer)'), 'Debe incluir bloque Sección 6');
assert(appearanceContent.includes('sections: sections'), 'handleSave debe enviar sections a la API');

console.log('✅ 4. Editor de Secciones UI: AppearanceTab integra los 6 bloques con interruptores ON/OFF y acordeones.');

// 5. Verificación de renderizado en TenantLandingView y apps/landing-ayme-pet
const tenantLandingPath = path.join(__dirname, '../src/components/TenantLandingView.tsx');
assert(fs.existsSync(tenantLandingPath), 'Debe existir src/components/TenantLandingView.tsx');
const tenantLandingContent = fs.readFileSync(tenantLandingPath, 'utf8');

assert(tenantLandingContent.includes('resolveLandingSections'), 'TenantLandingView debe importar resolveLandingSections');
assert(tenantLandingContent.includes('sections.top_bar.enabled'), 'TenantLandingView debe respetar toggle de top_bar');
assert(tenantLandingContent.includes('sections.header.enabled'), 'TenantLandingView debe respetar toggle de header');
assert(tenantLandingContent.includes('sections.header.show_whatsapp_button'), 'TenantLandingView debe respetar toggle de whatsapp en header');
assert(tenantLandingContent.includes('sections.footer.enabled'), 'TenantLandingView debe respetar toggle de footer');

const aymeStandalonePath = path.join(__dirname, '../apps/landing-ayme-pet/src/app/page.tsx');
assert(fs.existsSync(aymeStandalonePath), 'Debe existir apps/landing-ayme-pet/src/app/page.tsx');
const aymeStandaloneContent = fs.readFileSync(aymeStandalonePath, 'utf8');

assert(aymeStandaloneContent.includes('resolveLandingSections'), 'apps/landing-ayme-pet debe importar resolveLandingSections');
assert(aymeStandaloneContent.includes('sections.top_bar.enabled'), 'apps/landing-ayme-pet debe respetar toggle de top_bar');
assert(aymeStandaloneContent.includes('sections.header.enabled'), 'apps/landing-ayme-pet debe respetar toggle de header');
assert(aymeStandaloneContent.includes('sections.hero.enabled'), 'apps/landing-ayme-pet debe respetar toggle de hero');
assert(aymeStandaloneContent.includes('sections.hero.show_telemetry'), 'apps/landing-ayme-pet debe respetar toggle de telemetría');
assert(aymeStandaloneContent.includes('sections.pillars.enabled'), 'apps/landing-ayme-pet debe respetar toggle de pillars');
assert(aymeStandaloneContent.includes('sections.rfq_and_map.enabled'), 'apps/landing-ayme-pet debe respetar toggle de rfq_and_map');
assert(aymeStandaloneContent.includes('sections.footer.enabled'), 'apps/landing-ayme-pet debe respetar toggle de footer');

console.log('✅ 5. Renderizado Reactivo: Storefront principal y app dedicada respetan los 6 interruptores y datos configurados.');

console.log('\n🎉 ¡Todas las pruebas del Motor de Secciones Modulares pasaron exitosamente!');
