const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const url = process.env.HERO_TEST_URL || 'http://localhost:3002/store/ayme-pet';
const root = '[data-ayme-showcase]';
const scene = index => `${root} [data-showcase-scene="${index}"]`;
const active = `${root} [data-showcase-scene][aria-hidden="false"]`;
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function phase(page, index, offset = 0.5) {
  // La preferencia se aplica por evento + RAF + commit React. El comando de
  // emulación puede terminar antes: medir flujo estático apunta a otra escena.
  await page.waitForFunction(selector => {
    const el = document.querySelector(selector);
    return el?.getAttribute('data-pinned') === 'true' &&
      Math.abs(el.getBoundingClientRect().height - innerHeight * 3.8) < 1 &&
      getComputedStyle(el.firstElementChild).position === 'sticky' &&
      el.querySelectorAll('article[aria-hidden="false"]').length === 1;
  }, {}, root);
  await page.$eval(root, (el, args) => {
    const rect = el.getBoundingClientRect();
    scrollTo({ top: scrollY + rect.top + (rect.height - innerHeight) * ((args.index + args.offset) / 4), behavior: 'instant' });
  }, { index, offset });
  await page.waitForFunction((selector, index) => document.querySelector(selector)?.getAttribute('data-showcase-scene') === String(index), {}, active, index);
  await frames(page);
}
async function hitTargets(page, selector) {
  assert(await page.$$eval(`${selector} a, ${selector} button`, elements => elements.length > 0 && elements.every(el => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return r.height >= 44 && r.width >= 44 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && (hit === el || el.contains(hit));
  })), 'CTAs ≥44px, dentro de pantalla y alcanzables por hit-testing');
}
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    const errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (!['GET', 'HEAD'].includes(request.method()) || /maps\.google|google\.com\/maps/.test(request.url())) {
        blocked.push(`${request.method()} ${request.url().split('?')[0]}`);
        return request.abort();
      }
      return request.continue();
    });
    await page.setViewport({ width: 1440, height: 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    assert.equal((await page.$$(root)).length, 1, 'Una sección secundaria entre portada y catálogo');
    assert(await page.evaluate(() => {
      const hero = document.querySelector('[data-product-hero]'), showcase = document.querySelector('[data-ayme-showcase]');
      return hero.nextElementSibling === showcase && showcase.nextElementSibling.id === 'catalog-section';
    }));
    await page.waitForFunction(selector => [...document.querySelectorAll(`${selector} img`)].length === 4 && [...document.querySelectorAll(`${selector} img`)].every(img => img.complete && img.naturalWidth === 1200), {}, root);
    const sources = await page.$$eval(`${root} img`, images => images.map(img => img.getAttribute('src')));
    assert.deepEqual(sources.map(src => src.split('/').pop()), ['ayme-bear-bottle-purple-cap.webp', 'ayme-red-bear-bottle-spout.webp', 'ayme-clear-bottle-red-dispenser.webp', 'ayme-clear-printed-cup.webp']);
    for (const index of [0, 1, 2, 3, 2, 1, 0]) {
      await phase(page, index);
      await hitTargets(page, active);
      assert.equal((await page.$$(`${root} article:not([inert])`)).length, 1, 'Solo la escena activa recibe interacción');
      assert(await page.$eval(active, el => {
        const text = el.querySelector('[data-showcase-copy]').getBoundingClientRect();
        const image = el.querySelector('img').getBoundingClientRect();
        const matrix = new DOMMatrixReadOnly(getComputedStyle(el.querySelector('img')).transform);
        return text.right <= image.left && matrix.b === 0 && matrix.c === 0 && matrix.a > 0;
      }), 'Texto a izquierda y foto frontal sin rotación');
    }
    await phase(page, 0, 0.15);
    const geometry = () => page.$eval(`${scene(0)} img`, img => img.getBoundingClientRect().width);
    const entrance = await geometry();
    await phase(page, 0, 0.5);
    assert.notEqual(await geometry(), entrance, 'El scroll cambia la geometría');
    const still = await geometry();
    // El reposo se observa durante varias frames sin generar desplazamientos.
    for (let i = 0; i < 30; i++) await frames(page);
    assert.equal(await geometry(), still, 'No hay reproducción automática');
    if (process.env.SHOWCASE_SCREENSHOTS === '1') await page.screenshot({ path: '.next/ayme-scroll-showcase-desktop.png' });
    for (const index of [0, 3]) {
      await phase(page, index);
      const name = await page.$eval(`${active} h3`, el => el.textContent);
      const href = await page.$eval(`${active} a`, el => el.getAttribute('href'));
      const sku = index === 0 ? 'AYME-030' : 'AYME-042';
      await page.type('#catalog-section input', sku);
      await page.waitForFunction(name => document.querySelector('#products-grid [data-ayme-card] h3')?.textContent === name, {}, name);
      assert.equal(await page.$eval('#products-grid [data-ayme-card] h3 a', el => el.getAttribute('href')), href);
      // Typing scrolled to catalog; return and wait for genuine, stable action geometry.
      await phase(page, index);
      await hitTargets(page, active);
      await page.click(`${active} button`);
      await page.waitForSelector('button[aria-label="Cerrar carrito cotizador"]');
      assert((await page.$eval('body', el => el.textContent)).includes(name));
      await page.click('button[aria-label="Cerrar carrito cotizador"]');
      await page.focus('#catalog-section input');
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await page.waitForFunction(() => document.querySelector('#catalog-section input').value === '' && document.querySelectorAll('#products-grid [data-ayme-card]').length === 24);
    }
    const badge = await page.$eval('.cart-badge-count', el => el.textContent);
    for (const index of [1, 2]) {
      await phase(page, index);
      assert.equal((await page.$$(`${active} button, ${active} a[href*="producto/"]`)).length, 0);
      await page.click(`${active} a`);
      await page.waitForFunction(() => location.hash === '#contact-section' && document.querySelector('#contact-section').getBoundingClientRect().top < innerHeight);
      assert.equal(await page.$eval('.cart-badge-count', el => el.textContent), badge, 'Consulta no agrega al pedido');
    }
    await page.$eval('#catalog-section', el => el.scrollIntoView({ behavior: 'instant' }));
    assert(await page.$eval('#catalog-section', el => el.getBoundingClientRect().top < innerHeight));
    await phase(page, 3);
    await phase(page, 0);
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    // La emulación móvil puede recargar: esperar hidratación antes de medir la pista.
    await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-pinned') === 'true', {}, root);
    await frames(page);
    for (const index of [0, 1, 2, 3]) {
      await phase(page, index);
      await hitTargets(page, active);
      assert(await page.$eval(active, el => {
        const text = el.querySelector('[data-showcase-copy]').getBoundingClientRect(), image = el.querySelector('img').getBoundingClientRect();
        return image.bottom <= text.top && image.left >= 0 && image.right <= innerWidth && text.bottom <= innerHeight;
      }), 'Móvil: foto sobre texto, sin recortes');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    if (process.env.SHOWCASE_SCREENSHOTS === '1') await page.screenshot({ path: '.next/ayme-scroll-showcase-mobile.png' });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-pinned') === 'false', {}, root);
    assert.equal((await page.$$(`${root} article[inert], ${root} article[aria-hidden="true"]`)).length, 0);
    assert(await page.$$eval(`${root} article`, elements => elements.length === 4 && elements.every(el => getComputedStyle(el).visibility === 'visible' && el.getBoundingClientRect().height > 0)));
    if (process.env.SHOWCASE_SCREENSHOTS === '1') {
      await page.$eval(root, el => el.scrollIntoView({ behavior: 'instant' }));
      await page.screenshot({ path: '.next/ayme-scroll-showcase-reduced.png', fullPage: true });
    }
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await phase(page, 2);
    await page.setViewport({ width: 390, height: 500 });
    await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-pinned') === 'false', {}, root);
    assert.equal((await page.$$(`${root} article[inert]`)).length, 0, 'Ventana corta conserva todo el contenido en flujo');
    assert.deepEqual(errors, []);
    console.log('PASS: scroll 1→2→3→4 y reversa, geometría sin autoplay/rotación, acciones reales, consulta sin carrito, móvil, reducción dinámica, ventana corta, catálogo accesible');
    console.log('Solicitudes bloqueadas:', blocked);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
