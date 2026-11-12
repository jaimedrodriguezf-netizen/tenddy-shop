const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const url = process.env.HERO_TEST_URL || 'http://localhost:3002/store/ayme-pet';
const card = '#products-grid [data-ayme-card]';
// Focus can start smooth scrolling. A physical click must target the settled
// control, not coordinates measured while that scroll is still moving.
async function readyCardControl(page, selector) {
  await page.$eval(selector, el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.waitForFunction(async selector => {
    const el = document.querySelector(selector);
    if (!el) return false;
    const before = el.getBoundingClientRect();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const after = el.getBoundingClientRect();
    return before.x === after.x && before.y === after.y && before.width === after.width && before.height === after.height &&
      after.top >= 0 && after.bottom <= innerHeight && el.contains(document.elementFromPoint(after.x + after.width / 2, after.y + after.height / 2));
  }, {}, selector);
}
async function clickCardControl(page, selector) {
  await readyCardControl(page, selector);
  await page.evaluate(selector => {
    window.__cardClick = null;
    document.addEventListener('click', e => {
      window.__cardClick = { trusted: e.isTrusted, intended: !!e.target.closest(selector) };
    }, { capture: true, once: true });
  }, selector);
  await page.click(selector); // Real pointer input; never dispatch a synthetic click.
  assert.deepEqual(await page.evaluate(() => window.__cardClick), { trusted: true, intended: true }, 'Physical click hits the intended settled card control');
}
async function closeCart(page) {
  await page.click('button[aria-label="Cerrar carrito cotizador"]');
  await page.waitForSelector('button[aria-label="Cerrar carrito cotizador"]', { hidden: true });
}
const clickFilter = (page, text) => page.$$eval('#catalog-section button', (els, text) => {
  const el = els.find(el => el.textContent.trim().startsWith(text));
  if (!el) throw Error(`Missing filter ${text}`);
  el.click();
}, text);
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const writes = [];
    await page.setRequestInterception(true);
    page.on('request', r => {
      if (!['GET', 'HEAD'].includes(r.method())) { writes.push(r.url()); return r.abort(); }
      return r.continue();
    });
    await page.evaluateOnNewDocument(() => { window.__quotes = []; window.open = url => { window.__quotes.push(url); return null; }; });
    for (const width of [1440, 390]) {
      await page.setViewport({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      assert.equal(await page.$$eval(card, els => els.length), 24, 'AYME redesigned cards render');
      const geometry = await page.$$eval(card, els => {
        const first = els[0].getBoundingClientRect();
        return { columns: els.filter(el => el.getBoundingClientRect().top === first.top).length,
          fits: els.every(el => [...el.querySelectorAll('[data-card-actions] a, [data-card-actions] button')].every(control => {
            const b = control.getBoundingClientRect(), c = el.getBoundingClientRect();
            return b.height >= 44 && b.left >= c.left && b.right <= c.right && b.bottom <= c.bottom && control.scrollWidth <= control.clientWidth;
          })) };
      });
      assert.equal(geometry.columns, width === 1440 ? 4 : 2);
      assert(geometry.fits, 'All controls fit inside card with 44px targets');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const primary = `${card} button[title="Agregar al pedido"]`;
      assert.equal(await page.$eval(primary, el => el.textContent.trim()), 'Agregar al pedido');
      assert(await page.$eval(primary, el => !!el.querySelector('svg')));
      await readyCardControl(page, primary);
      await page.focus(primary);
      assert(await page.$eval(primary, el => getComputedStyle(el).outlineStyle !== 'none'));
      await page.keyboard.press('Enter');
      await page.waitForSelector('button[aria-label="Cerrar carrito cotizador"]');
      const summary = () => page.$eval('button[aria-label="Cerrar carrito cotizador"]', el => el.parentElement.querySelector('p').textContent.trim());
      const before = await summary();
      assert.equal(await page.$eval('.cart-badge-count', el => el.textContent), '1');
      await closeCart(page);
      await clickCardControl(page, primary);
      await page.waitForSelector('button[aria-label="Cerrar carrito cotizador"]');
      assert.equal(Number((await summary()).match(/•\s*(\d+)/)[1]), Number(before.match(/•\s*(\d+)/)[1]) + 1);
      await closeCart(page);
      const name = await page.$eval(`${card} h3`, el => el.textContent);
      await clickCardControl(page, `${card} button[title="Cotizar por WhatsApp"]`);
      assert((await page.evaluate(() => window.__quotes)).some(url => new URL(url).searchParams.get('text').includes(name)));
      const href = await page.$eval(`${card} a[title="Ver Ficha Técnica en página separada"]`, el => el.href);
      await clickCardControl(page, `${card} a[title="Ver Ficha Técnica en página separada"]`);
      await page.waitForFunction(href => location.href === href, {}, href);
      await page.goBack({ waitUntil: 'networkidle2' });
      await page.waitForSelector(card);
      assert(await page.evaluate(() => location.hash === '#catalog-section'));
      await clickFilter(page, '500 ml');
      await page.waitForFunction(() => [...document.querySelectorAll('[data-ayme-card]')].length > 0 && [...document.querySelectorAll('[data-ayme-card]')].every(el => /500\s?ml/i.test(el.textContent)));
      await clickFilter(page, 'Todas');
      const category = await page.$$eval('#catalog-section button', els => els.map(el => el.textContent.trim()).find(t => /\(\d+\)$/.test(t) && !t.startsWith('Todos') && !t.startsWith('Ver más')));
      if (category) { await clickFilter(page, category); await clickFilter(page, 'Todos'); }
      else console.log('SKIP: live category action — no categories; deterministic fixture covers category filtering');
      const search = '#catalog-section input';
      const sku = await page.$eval(`${card} [data-card-sku]`, el => el.textContent.replace('SKU: ', ''));
      await page.type(search, sku);
      await page.waitForFunction(() => document.querySelectorAll('[data-ayme-card]').length === 1);
      await page.$eval(search, el => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, 'zz-no-reference-zz'); el.dispatchEvent(new Event('input', { bubbles: true })); });
      await page.waitForSelector('#catalog-section h4');
      await clickFilter(page, 'Restablecer Filtros');
      await page.waitForFunction(() => document.querySelectorAll('[data-ayme-card]').length === 24);
      await clickFilter(page, 'Ver más referencias');
      await page.waitForFunction(() => document.querySelectorAll('[data-ayme-card]').length === 43);
      // Padding above first row keeps the fixed header from clipping the screenshot.
      await page.$eval('#products-grid', el => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 160, behavior: 'instant' }));
      await new Promise(r => setTimeout(r, 500));
      if (process.env.CARD_SCREENSHOTS === '1') await page.screenshot({ path: `.next/ayme-product-cards-${width === 1440 ? 'desktop' : 'mobile'}.png` });
      console.log(`PASS: ${width}px layout, controls, keyboard/cart increment, quote interception, Ficha/back, search/capacity/load more`);
    }
    assert(!writes.some(url => new URL(url).pathname === '/api/quotes'), 'Card quote opens intended URL without lead submission');
    console.log('Blocked automatic non-GET requests:', writes);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
