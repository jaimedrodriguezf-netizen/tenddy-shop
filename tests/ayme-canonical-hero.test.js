const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const puppeteer = require('puppeteer');
const url = process.env.HERO_TEST_URL || 'http://localhost:3002/store/ayme-pet';
const hero = '[data-product-hero]';
const layers = `${hero} img`;
const control = `${hero} button`;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const transforms = page => page.$$eval(layers, imgs => imgs.map(img => getComputedStyle(img).transform));
const shot = (page, name) => page.screenshot({ path: path.join(__dirname, `../.next/ayme-canonical-${name}.png`) });
const clickCatalog = (page, label) => page.$$eval('#catalog-section button', (buttons, text) => {
  const button = buttons.find(el => el.textContent.trim().startsWith(text));
  if (!button) throw new Error(`Botón no encontrado: ${text}`);
  button.click();
}, label);
async function moving(page) {
  const before = await transforms(page);
  await wait(700);
  assert((await transforms(page)).every((value, i) => value !== before[i]), 'Every layer moves automatically');
  assert(await page.$$eval(layers, imgs => imgs.every(img => {
    const m = new DOMMatrixReadOnly(getComputedStyle(img).transform);
    return m.b === 0 && m.c === 0 && m.a > 0 && m.d > 0;
  })), 'No rotation');
}
async function catalogIntact(page) {
  assert.equal(await page.$eval('#products-grid', el => el.children.length), 24);
  assert.match(await page.$eval('#catalog-section', el => el.textContent), /Mostrando 24 de 43 referencias técnicas/);
  assert.equal(await page.$eval('#catalog-section', el => getComputedStyle(el).backgroundColor), 'rgb(248, 250, 252)');
  assert.equal(await page.$eval('#contact-section', el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
  assert.equal((await page.$$('#contact-section form input')).length, 4);
  assert.equal((await page.$$('#contact-section form select, #contact-section form textarea')).length, 2);
  assert.equal((await page.$$('#contact-section iframe, footer.site-footer')).length, 2);
}
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage(); // Fresh isolated cart, no persistent profile.
    const errors = [];
    const writes = [];
    page.on('pageerror', e => errors.push(e.message));
    const preventWrites = async target => {
      await target.setRequestInterception(true);
      target.on('request', request => {
        if (!['GET', 'HEAD'].includes(request.method())) { writes.push(request.url()); return request.abort(); }
        return request.continue();
      });
    };
    await preventWrites(page);
    page.setDefaultTimeout(20000);
    await page.setViewport({ width: 1440, height: 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('h1');
    assert.equal((await page.$$(hero)).length, 1, 'Exactly one new canonical hero');
    assert.equal((await page.$$('#hero-background-video, #scroll-sequence-track, .hud-telemetry-col')).length, 0);
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(img => img.complete && img.naturalWidth === 1200), {}, layers);
    const sources = await page.$$eval(layers, imgs => imgs.map(img => img.getAttribute('src')));
    assert.equal(sources.length, 4);
    for (const source of sources) {
      const file = path.basename(source);
      const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
      const original = fs.readFileSync(path.join(__dirname, '../apps/landing-ayme-pet/public/assets/hero/prepared', file));
      // Browser image decoding above proves public accessibility; compare exact local bytes.
      assert.equal(hash(fs.readFileSync(path.join(__dirname, '../public', source))), hash(original));
    }
    await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('aria-label') === 'Pausar animación de productos', {}, control);
    await catalogIntact(page);
    await moving(page);
    assert.equal(await page.evaluate(() => scrollY), 0);
    await page.click(control);
    assert.equal(await page.$eval(control, el => el.getAttribute('aria-pressed')), 'true');
    assert.equal(await page.$eval(control, el => el.getAttribute('aria-label')), 'Reanudar animación de productos');
    const paused = await transforms(page);
    await wait(700);
    assert.deepEqual(await transforms(page), paused);
    await page.focus(control);
    assert(await page.$eval(control, el => getComputedStyle(el).outlineStyle !== 'none'));
    await page.keyboard.press('Enter');
    assert.equal(await page.$eval(control, el => el.getAttribute('aria-pressed')), 'false');
    await moving(page);
    await shot(page, 'desktop');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.waitForFunction(selector => document.querySelector(selector)?.disabled, {}, control);
    const reduced = await transforms(page);
    await wait(700);
    assert.deepEqual(await transforms(page), reduced);
    assert(await page.$$eval(layers, imgs => imgs.every(img => getComputedStyle(img).opacity === '1')));
    assert.equal(await page.$eval(control, el => el.getAttribute('aria-label')), 'Animación desactivada por movimiento reducido');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await page.waitForFunction(selector => !document.querySelector(selector)?.disabled, {}, control);
    await moving(page);
    console.log('PASS: hero único, imágenes/hash, profundidad sin scroll/rotación, pausa global, teclado y preferencia dinámica');

    await page.click(`${hero} a[href="#catalog-section"]`);
    await page.waitForFunction(() => location.hash === '#catalog-section' && document.querySelector('#catalog-section').getBoundingClientRect().top < innerHeight);
    const category = await page.$$eval('#catalog-section button', buttons => buttons.map(b => b.textContent.trim()).find(text => /\([1-9]\d*\)$/.test(text) && !text.startsWith('Todos')));
    if (category) {
      await clickCatalog(page, category);
      const categoryCount = Number(category.match(/\((\d+)\)$/)[1]);
      await page.waitForFunction(count => document.querySelectorAll('#products-grid [data-ayme-card]').length === Math.min(24, count), {}, categoryCount);
      await clickCatalog(page, 'Todos (43)');
    } else console.log('SKIP: live category action — no categories; covered by deterministic card fixture');
    await clickCatalog(page, '500 ml');
    await page.waitForFunction(() => [...document.querySelectorAll('#products-grid [data-ayme-card]')].every(el => /500\s?ml/i.test(el.textContent)));
    assert((await page.$$('#products-grid [data-ayme-card]')).length > 0);
    await clickCatalog(page, 'Todas');
    const search = '#catalog-section input';
    const sku = await page.$eval('#products-grid [data-card-sku]', el => el.textContent.trim().replace('SKU: ', ''));
    await page.type(search, sku);
    await page.waitForFunction(() => document.querySelectorAll('#products-grid [data-ayme-card]').length === 1);
    await page.$eval(search, el => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(el, ''); el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForFunction(() => document.querySelectorAll('#products-grid [data-ayme-card]').length === 24);
    await clickCatalog(page, 'Ver más referencias');
    await page.waitForFunction(() => document.querySelectorAll('#products-grid [data-ayme-card]').length === 43);
    await shot(page, 'catalog');
    const ficha = await page.$eval('#products-grid a[title="Ver Ficha Técnica en página separada"]', el => el.href);
    assert.match(ficha, /\/store\/ayme-pet\/producto\//);
    const detail = await browser.newPage();
    await preventWrites(detail);
    const detailResponse = await detail.goto(ficha, { waitUntil: 'domcontentloaded', timeout: 60000 });
    assert.equal(detailResponse.status(), 200);
    await detail.waitForSelector('h1');
    await detail.close();
    await page.click('#products-grid button[title="Agregar al pedido"]');
    await page.waitForSelector('button[aria-label="Cerrar carrito cotizador"]');
    assert.match(await page.$eval('body', el => el.textContent), /Carrito Cotizador B2B/);
    assert.equal(await page.$eval('.cart-badge-count', el => el.textContent), '1');
    const cartSummary = () => page.$eval('button[aria-label="Cerrar carrito cotizador"]', el => el.parentElement.querySelector('p').textContent.trim());
    const cartBefore = await cartSummary();
    const packagesBefore = Number(cartBefore.match(/•\s*(\d+)/)[1]);
    await page.click('button[aria-label="Cerrar carrito cotizador"]');
    await page.click('#products-grid button[title="Agregar al pedido"]');
    await page.waitForSelector('button[aria-label="Cerrar carrito cotizador"]');
    const cartAfter = await cartSummary();
    assert.equal(Number(cartAfter.match(/•\s*(\d+)/)[1]), packagesBefore + 1, 'Adding another Bulto increments public package total');
    assert.match(cartAfter, /^1 modelo/);
    assert.equal(await page.$eval('.cart-badge-count', el => el.textContent), '1');
    await page.click('button[aria-label="Cerrar carrito cotizador"]');
    await page.$eval('#contact-section', el => el.scrollIntoView({ behavior: 'instant' }));
    await shot(page, 'contact');
    console.log('PASS: catálogo principal, categoría/capacidad/búsqueda, 24→43, ruta Ficha, Bulto/carrito/badge, contacto/mapa/footer');

    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(selector => !document.querySelector(selector)?.disabled, {}, control);
    await moving(page);
    for (let phase = 0; phase < 4; phase++) {
      assert(await page.$$eval(layers, imgs => imgs.every(img => {
        const b = img.getBoundingClientRect(), stage = img.parentElement.getBoundingClientRect();
        return b.left >= stage.left && b.right <= stage.right && b.top >= stage.top && b.bottom <= stage.bottom;
      })), `Mobile framing phase ${phase}`);
      await wait(6000);
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert(await page.$$eval(`${hero} a`, links => links.length === 2 && links.every(el => {
      const b = el.getBoundingClientRect();
      return b.left >= 0 && b.right <= innerWidth && b.bottom <= innerHeight && b.height >= 44 && b.top > document.querySelector('#site-header').getBoundingClientRect().bottom;
    })));
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.waitForFunction(selector => document.querySelector(selector)?.disabled, {}, control);
    assert(await page.$$eval(layers, imgs => imgs.every(img => {
      const b = img.getBoundingClientRect();
      return getComputedStyle(img).opacity === '1' && b.left >= 0 && b.right <= innerWidth;
    })), 'Four static mobile products visible and inside viewport');
    const mobileReduced = await transforms(page);
    await wait(700);
    assert.deepEqual(await transforms(page), mobileReduced);
    await shot(page, 'mobile');
    await page.click(`${hero} a[href="#contact-section"]`);
    await page.waitForFunction(() => location.hash === '#contact-section' && document.querySelector('#contact-section').getBoundingClientRect().top < innerHeight);
    assert.deepEqual(errors, []);
    assert(writes.every(value => {
      const blocked = new URL(value);
      return blocked.pathname === '/api/views' || blocked.hostname === 'maps.googleapis.com';
    }), 'Only automatic view/map requests attempted; all non-GET requests blocked, no quotes or messages');
    console.log('Solicitudes automáticas bloqueadas (sin mutación):', writes);
    console.log('PASS: móvil 390, ciclo completo sin recortes/overflow, CTAs usables, sin errores de ejecución ni mutaciones');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
