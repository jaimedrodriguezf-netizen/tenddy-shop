const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');

// Render the public component with real helpers, cart and children; only CSS
// module names are substituted because Node has no stylesheet loader.
function render(slug = 'other-factory', enabled = true, source, fixture = {}) {
  const originalResolve = Module._resolveFilename;
  const originalTs = require.extensions['.ts'];
  const originalTsx = require.extensions['.tsx'];
  const originalCss = require.extensions['.css'];
  const entry = path.join(root, 'src/components/TenantLandingView.tsx');
  const compile = (module, filename) => module._compile(ts.transpileModule(
    filename === entry && source !== undefined ? source : fs.readFileSync(filename, 'utf8'),
    { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }
  ).outputText, filename);
  Module._resolveFilename = function (name, ...args) {
    if (name.startsWith('@/')) {
      const local = path.join(root, 'src', name.slice(2));
      name = ['.ts', '.tsx'].map(ext => local + ext).find(file => fs.existsSync(file)) || local;
    }
    return originalResolve.call(this, name, ...args);
  };
  require.extensions['.ts'] = compile;
  require.extensions['.tsx'] = compile;
  require.extensions['.css'] = module => { module.exports = new Proxy({}, { get: (_, name) => String(name) }); };
  try {
    delete require.cache[entry];
    const View = require(entry).default;
    const tenant = {
      id: 'fixture-tenant', slug, name: 'Fábrica de prueba', industry_type: 'plastics', logo_url: '/assets/logo.png',
      theme_config: { primary_color: '#A61C2E', secondary_color: '#8C1625', store_template: 'landing', packaging_unit: { singular: 'Bulto', plural: 'Bultos' } },
      landing_config: { whatsapp_default: '0998722324', sections: { hero: { enabled } } }, settings: {},
    };
    const products = Array.from({ length: 43 }, (_, i) => ({
      id: `product-${i}`, tenant_id: tenant.id, category_id: 'bottles', name: `Botella ${i} 500ml`, slug: `botella-${i}`,
      sku: `FIX-${i}`, images: [], units_per_package: 100, attributes: { specs: { capacidad: '500ml', boca: '28mm' } },
    }));
    return renderToStaticMarkup(React.createElement(View, { tenant, products, categories: [{ id: 'bottles', name: 'Botellas PET', slug: 'botellas' }], branches: [], ...fixture }));
  } finally {
    Module._resolveFilename = originalResolve;
    for (const [ext, previous] of [['.ts', originalTs], ['.tsx', originalTsx], ['.css', originalCss]]) {
      if (previous) require.extensions[ext] = previous;
      else delete require.extensions[ext];
    }
  }
}
function check() {
  const other = render();
  assert.match(other, /id="hero-background-video"/);
  assert.match(other, /id="scroll-sequence-track"/);
  assert.match(other, /MONITOREO DE LÍNEA EN TIEMPO REAL/);
  assert.doesNotMatch(other, /data-product-hero/);
  // Existing non-AYME behavior ignores hero.enabled; preserve it deliberately.
  assert.match(render('other-factory', false), /id="hero-background-video"/);
  assert.doesNotMatch(render('ayme-pet-extra'), /data-product-hero/);
  const ayme = render('ayme-pet');
  assert.equal((ayme.match(/data-product-hero=/g) || []).length, 1);
  assert.doesNotMatch(ayme, /id="hero-background-video"|id="scroll-sequence-track"|MONITOREO DE LÍNEA/);
  assert.match(ayme, /href="#catalog-section"/);
  assert.match(ayme, /href="#contact-section"/);
  const disabled = render('ayme-pet', false);
  assert.doesNotMatch(disabled, /data-product-hero|id="hero-background-video"|id="scroll-sequence-track"/);
  for (const html of [other, ayme, disabled]) {
    assert.match(html, /id="catalog-section"[^>]+background:var\(--bg-main\)/);
    assert.equal((html.match(/class="product-card group"|data-ayme-card=/g) || []).length, 24);
    assert.match(html, /Mostrando <strong>24<\/strong> de <strong>43<\/strong>/);
    assert.match(html, /Botellas PET \(43\)/);
    assert.match(html, /60 ml \(2 Oz\)/);
    assert.match(html, /500 ml/);
    assert.match(html, /19 restantes/);
    assert.match(html, /producto\/botella-0/);
    assert.match(html, /Agregar al Cotizador|Agregar al pedido/);
    assert.match(html, /100 u\/bulto/);
    assert.match(html, /id="contact-section"/);
    for (const field of ['Nombre y Apellido', 'Empresa / Razón Social', 'Teléfono / WhatsApp', 'Ciudad / Provincia', 'Mensaje / Cantidades estimadas']) assert(html.includes(field));
    assert.match(html, /class="custom-contact-form"/);
    assert.match(html, /<iframe/);
    assert.match(html, /<footer class="site-footer"/);
  }
  assert.equal(ayme.slice(ayme.indexOf('<section id="catalog-section"')), disabled.slice(disabled.indexOf('<section id="catalog-section"')), 'Hero toggle leaves all below-hero sections identical');
  console.log('PASS: render público: aislamiento exacto, hero desactivado, catálogo 24/43, filtros, fichas, Bulto, formulario, mapa y footer');
}
module.exports = { render };
if (require.main === module) check();
