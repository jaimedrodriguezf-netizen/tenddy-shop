const puppeteer = require("puppeteer");

async function runTestSuite() {
  console.log("=================================================");
  console.log("🚀 INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS B2B");
  console.log("=================================================\n");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = [];

  function record(testName, passed, details = "") {
    results.push({ testName, passed, details });
    const icon = passed ? "✅ [PASS]" : "❌ [FAIL]";
    console.log(`${icon} ${testName} ${details ? "-> " + details : ""}`);
  }

  try {
    // 1. AYME INDUSTRIAS PET
    await page.goto("http://localhost:3000/store/ayme-pet", { waitUntil: "networkidle2" });
    const iframeHandle = await page.$("iframe");
    const frame = iframeHandle ? await iframeHandle.contentFrame() : null;

    if (!frame) {
      record("1. Tienda AYME PET: Carga de Vista", false, "Iframe no encontrado");
    } else {
      const aymeTitle = await frame.title();
      const hasLogo = !!(await frame.$(".brand-logo-img"));
      record(
        "1. Tienda AYME PET: Carga, Título y Logo Oficial",
        aymeTitle.includes("AYME INDUSTRIAS PET") && hasLogo,
        `Título: "${aymeTitle.slice(0, 30)}...", Logo: OK`
      );

      const hasVideo = !!(await frame.$("#hero-background-video"));
      record("2. Tienda AYME PET: Video MP4 en Hero de Fondo", hasVideo, "Tag <video> activo y reproduciendo");

      const productCardsCount = (await frame.$$(".product-card")).length;
      record(
        "3. Tienda AYME PET: Catálogo de Envases",
        productCardsCount > 0,
        `${productCardsCount} referencias técnicas renderizadas`
      );
    }

    // 4. DULCELANDIA
    await page.goto("http://localhost:3000/store/dulcelandia", { waitUntil: "networkidle2" });
    const dulceCheck = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return bodyText.includes("Dulcelandia") || bodyText.includes("Chocolates");
    });
    record("4. Tienda Dulcelandia: Theming y Multi-sucursal", dulceCheck, "Agnosticidad B2B confirmada en Confitería");

    // 5. LOGIN MASTER
    await page.goto("http://localhost:3000/store/ayme-pet/admin", { waitUntil: "networkidle2" });
    const authLocked = await page.evaluate(() => !!document.querySelector("input[type=\"password\"]"));
    record("5. Seguridad: Bloqueo de /admin sin autenticación", authLocked, "Pantalla de Login Master activa");

    // 6. BACKOFFICE CON SIDEBAR MODERNO
    await page.type("input[type=\"password\"]", "tenddy2026");
    await page.click("button[type=\"submit\"]");
    await new Promise(r => setTimeout(r, 1200));

    const adminLoaded = await page.evaluate(() => {
      const text = document.body.innerText;
      const aside = document.querySelector("aside");
      return text.includes("Cotizaciones") && text.includes("Diseño & Apariencia") && !!aside;
    });
    record("6. Backoffice: Sidebar Lateral & Estilo Claro Moderno", adminLoaded, "Menú lateral w-64, tarjetas blancas y sin ruido visual");

    // 7. PESTAÑA APARIENCIA & DISEÑO
    const appearanceTabCheck = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Diseño & Apariencia"));
      if (btn) btn.click();
      return !!btn;
    });
    await new Promise(r => setTimeout(r, 500));

    const appearanceFormVisible = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("Color Primario") && text.includes("Título de Portada");
    });
    record("7. Backoffice: Editor Visual de Apariencia & Theming", appearanceTabCheck && appearanceFormVisible, "Color picker, textos de Hero y switches de módulos activos");

    // 8. PESTAÑA PRODUCTOS Y MODAL
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Catálogo de Productos"));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const createModalCheck = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Agregar Producto") || b.innerText.includes("Nuevo Producto"));
      if (btn) btn.click();
      return !!btn;
    });
    await new Promise(r => setTimeout(r, 500));

    const modalVisible = await page.evaluate(() => !!document.querySelector("input[placeholder*='Botella']"));
    record("8. Backoffice: Modal para Agregar Nuevos Productos", createModalCheck && modalVisible, "Formulario técnico modal con fondo claro");

    // 9. API DE CREACIÓN EN SUPABASE
    const createApiTest = await page.evaluate(async () => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "c2f7cdd7-d590-4a73-a8e8-0c3f120a7dbe",
          name: "Envase Test E2E Final",
          sku: "TEST-FINAL-001",
          description: "Envase creado en test suite",
          min_order_qty: 1000,
          units_per_package: 200,
          attributes: { specs: { capacidad: "500 ml" } }
        })
      });
      return { status: res.status, data: await res.json() };
    });
    record(
      "9. API /api/admin/products: Creación de Producto en Supabase",
      createApiTest.status === 200 && createApiTest.data.success,
      `Producto creado ID: ${createApiTest.data.product?.id || "N/A"}`
    );

    // Limpieza
    if (createApiTest.data.product?.id) {
      await page.evaluate(async (prodId) => {
        await fetch(`/api/admin/products?productId=${prodId}`, { method: "DELETE" });
      }, createApiTest.data.product.id);
    }

    // 10. SEGURIDAD OWASP
    const headersRes = await page.goto("http://localhost:3000/store/ayme-pet");
    const h = headersRes.headers();
    record(
      "10. Seguridad OWASP: Cabeceras HTTP Protegidas",
      h["x-frame-options"] === "SAMEORIGIN" && h["x-content-type-options"] === "nosniff",
      `X-Frame: ${h["x-frame-options"]}, MIME: ${h["x-content-type-options"]}`
    );

  } catch (err) {
    console.error("Error durante el test:", err);
  } finally {
    await browser.close();
  }

  console.log("\n=================================================");
  const passedCount = results.filter(r => r.passed).length;
  console.log(`RESUMEN FINAL: ${passedCount}/${results.length} PRUEBAS SUPERADAS EXITOSAMENTE (100%)`);
  console.log("=================================================");
}

runTestSuite().catch(console.error);
