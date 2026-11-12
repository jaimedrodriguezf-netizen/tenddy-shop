const assert = require('node:assert/strict');
const { render } = require('./ayme-canonical-hero-render.test');
const products = [
  { id: 'bear', tenant_id: 'fixture-tenant', sku: 'AYME-030', slug: 'oso-real', name: 'Oso real 200 ml nombre vigente', images: [], description: 'BPA-free certificado', units_per_package: 12 },
  { id: 'cup', tenant_id: 'fixture-tenant', sku: 'AYME-042', slug: 'vaso-real', name: 'Vaso de Polipropileno 250 ml vigente', images: [], units_per_package: 12 },
  { id: 'ambiguous', tenant_id: 'fixture-tenant', sku: 'AYME-032', slug: 'no-asignar', name: 'No asignar 200 ml', images: [] },
];
function section(html) {
  const match = html.match(/<section[^>]*data-ayme-showcase=""[\s\S]*?<\/section>/);
  assert(match, 'La sección secundaria existe en el render público');
  return match[0];
}
const html = render('ayme-pet', true, undefined, { products });
const showcase = section(html);
assert.equal((html.match(/data-ayme-showcase=""/g) || []).length, 1);
assert(html.indexOf('data-product-hero=') < html.indexOf('data-ayme-showcase='));
assert(html.indexOf('data-ayme-showcase=') < html.indexOf('id="catalog-section"'));
assert.equal((showcase.match(/data-showcase-scene=/g) || []).length, 4);
assert.equal((showcase.match(/\.webp/g) || []).length, 4);
for (const product of products.slice(0, 2)) {
  assert(showcase.includes(product.name));
  assert(showcase.includes(`/store/ayme-pet/producto/${product.slug}`));
}
assert.equal((showcase.match(/Agregar al pedido<\/button>/g) || []).length, 2);
assert.equal((showcase.match(/Consultar este modelo<\/a>/g) || []).length, 2);
assert.doesNotMatch(showcase, /BPA|certificado|12 u\/|no-asignar|AYME-032|AYME-033|AYME-009|u\/bulto/);
const scenes = showcase.match(/<article[\s\S]*?<\/article>/g);
for (const index of [1, 2]) {
  assert.doesNotMatch(scenes[index], /\bml\b|SKU|Polipropileno|PET|plástico|<button|producto\//i);
  assert.match(scenes[index], /href="#contact-section"/);
}
const missing = section(render('ayme-pet', true, undefined, { products: [] }));
assert.equal((missing.match(/Consultar este modelo<\/a>/g) || []).length, 4);
assert.doesNotMatch(missing, /producto\/|<button|\bml\b|SKU|AYME-0/);
assert.match(section(render('ayme-pet', false)), /data-showcase-scene=/);
for (const slug of ['other-factory', 'ayme-pet-extra', 'ayme', 'AYME-PET']) {
  assert.doesNotMatch(render(slug, true, undefined, { products }), /data-ayme-showcase|data-showcase-scene/);
}
console.log('PASS: orden hero→sección→catálogo, cuatro fotos, nombres/rutas vigentes, dos consultas sin identidad inventada, fallback sin referencias, aislamiento exacto');
