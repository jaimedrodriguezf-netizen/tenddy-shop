const assert = require('node:assert/strict');
const React = require('react');
const { render } = require('./ayme-canonical-hero-render.test');
const products = [
  { id: 'cup', tenant_id: 'fixture-tenant', category_id: 'cups', name: 'Vaso PP identidad completa sin recortar', sku: 'PP-01', slug: 'vaso-pp', images: ['/real-cup.png'], units_per_package: 800, attributes: { badge: 'Nuevo', video_url: '/real-video.mp4', specs: { capacidad: '500 ml', material: 'PP', boca: '95 mm' } } },
  { id: 'missing', tenant_id: 'fixture-tenant', name: 'Sin datos', sku: 'NO-02', images: [], units_per_package: 100, attributes: { specs: { tallas: 'Estándar', material: '', boca: null, capacidad: 'N/A' } } },
];
const fixture = { products, categories: [{ id: 'cups', name: 'Vasos PP' }] };
const html = render('ayme-pet', true, undefined, fixture);
assert.equal((html.match(/data-ayme-card=/g) || []).length, 2, 'AYME new card boundary');
assert.match(html, /Agregar al pedido/);
assert.match(html, /800 u\/bulto/);
assert.match(html, /SKU: PP-01/);
assert.match(html, /Vaso PP identidad completa sin recortar/);
assert.match(html, /500 ml/); assert.match(html, /95 mm/);
assert.match(html, /Nuevo/); assert.match(html, /Video 360°/);
assert.match(html, /alt="Sin datos"/);
assert.match(html, /placeholder-product.svg/);
assert.doesNotMatch(html, /Envase PET|Estándar|N\/A|Tallas/);
assert.match(html, /producto\/vaso-pp/);
assert.match(html, /data-card-actions/);
for (const slug of ['other-factory', 'ayme-pet-extra', 'ayme', 'AYME-PET']) {
  const other = render(slug, true, undefined, fixture);
  assert.doesNotMatch(other, /data-ayme-card|Agregar al pedido/);
  assert.match(other, /Agregar al Cotizador/);
}
const normal = render('ayme-pet');
assert.equal(html.slice(html.indexOf('<section id="contact-section"')), normal.slice(normal.indexOf('<section id="contact-section"')), 'Below catalog unchanged');
// Drive the public view with deterministic initial selected-category state, not live DB data.
const original = React.useState;
try {
  let stateIndex = 0;
  React.useState = value => original(stateIndex++ === 0 ? 'cups' : value);
  const filtered = render('ayme-pet', true, undefined, fixture);
  assert.equal((filtered.match(/data-ayme-card=/g) || []).length, 1);
  assert.match(filtered, /SKU: PP-01/);
  assert.doesNotMatch(filtered, /SKU: NO-02/);
} finally { React.useState = original; }
console.log('PASS: real/missing specs, real packaging, no-image, badges/video, exact tenant isolation, category fixture, below-catalog unchanged');
