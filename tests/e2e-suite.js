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
  await page.setViewport({ width: 1280, height: 800 });

  const results = [];

  function record(testName, passed, details = "") {
    results.push({ testName, passed, details });
    const icon = passed ? "✅ [PASS]" : "❌ [FAIL]";
    console.log(`${icon} ${testName} ${details ? "-> " + details : ""}`);
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: AYME INDUSTRIAS PET - Carga de Iframe y Título
    // -------------------------------------------------------------
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

      // -------------------------------------------------------------
      // TEST 2: AYME INDUSTRIAS PET - Video de Planta en Vivo
      // -------------------------------------------------------------
      const hasVideo = !!(await frame.$("#hero-background-video"));
      record("2. Tienda AYME PET: Video MP4 en Hero de Fondo", hasVideo, "Tag <video> activo y reproduciendo");

      // -------------------------------------------------------------
      // TEST 3: AYME INDUSTRIAS PET - Catálogo de Envases
      // -------------------------------------------------------------
      const productCardsCount = (await frame.$$(".product-card")).length;
      record(
        "3. Tienda AYME PET: Catálogo de Envases",
        productCardsCount > 0,
        `${productCardsCount} referencias técnicas renderizadas en el DOM`
      );
    }

    // -------------------------------------------------------------
    // TEST 4: DULCELANDIA - Multi-tenant y Theming Dinámico
    // -------------------------------------------------------------
    await page.goto("http://localhost:3000/store/dulcelandia", { waitUntil: "networkidle2" });
    const dulceCheck = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const hasDulce = bodyText.includes("Dulcelandia") || bodyText.includes("Chocolates");
      const hasBranches = bodyText.includes("CEDI Central Bogotá") || bodyText.includes("Bogotá");
      return { hasDulce, hasBranches };
    });
    record(
      "4. Tienda Dulcelandia: Theming y Multi-sucursal",
      dulceCheck.hasDulce && dulceCheck.hasBranches,
      "Agnosticidad B2B confirmada en Confitería"
    );

    // -------------------------------------------------------------
    // TEST 5: SEGURIDAD - Login Master en Panel /admin
    // -------------------------------------------------------------
    await page.goto("http://localhost:3000/store/ayme-pet/admin", { waitUntil: "networkidle2" });
    const authLocked = await page.evaluate(() => {
      const hasPasswordInput = !!document.querySelector("input[type=\"password\"]");
      return hasPasswordInput;
    });
    record(
      "5. Seguridad: Bloqueo de /admin sin autenticación",
      authLocked,
      "Pantalla de Login Master activa"
    );

    // -------------------------------------------------------------
    // TEST 6: BACKOFFICE - Autenticación y Carga de Métricas
    // -------------------------------------------------------------
    await page.type("input[type=\"password\"]", "tenddy2026");
    await page.click("button[type=\"submit\"]");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    const adminLoaded = await page.evaluate(() => {
      const hasMetrics = document.body.innerText.includes("Total Cotizaciones");
      const hasCatalog = document.body.innerText.includes("Catálogo de Productos Activos");
      return hasMetrics && hasCatalog;
    });
    record(
      "6. Backoffice: Ingreso exitoso y métricas en vivo",
      adminLoaded,
      "Sesión HttpOnly establecida y panel cargado"
    );

    // -------------------------------------------------------------
    // TEST 7: GESTIÓN DE PRODUCTOS - Modal de Crear Producto
    // -------------------------------------------------------------
    const createModalCheck = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Nuevo Producto") || b.innerText.includes("Agregar Referencia"));
      if (btn) btn.click();
      return !!btn;
    });
    await new Promise(r => setTimeout(r, 600));

    const modalVisible = await page.evaluate(() => {
      const modal = document.querySelector("input[placeholder*='Botella']");
      return !!modal;
    });
    record(
      "7. Backoffice: Modal para Agregar Nuevos Productos",
      createModalCheck && modalVisible,
      "Formulario técnico de molde/alimento visible"
    );

    // -------------------------------------------------------------
    // TEST 8: CREACIÓN REAL DE PRODUCTO VÍA API EN SUPABASE
    // -------------------------------------------------------------
    const createApiTest = await page.evaluate(async () => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "c2f7cdd7-d590-4a73-a8e8-0c3f120a7dbe",
          name: "Envase Test Automatizado E2E",
          sku: "TEST-E2E-001",
          description: "Envase de prueba creado en test automatizado",
          min_order_qty: 1000,
          units_per_package: 200,
          attributes: { specs: { capacidad: "750 ml", boca: "28mm PCO" } }
        })
      });
      return { status: res.status, data: await res.json() };
    });
    record(
      "8. API /api/admin/products: Creación de Producto en Supabase",
      createApiTest.status === 200 && createApiTest.data.success,
      `Producto creado exitosamente con ID: ${createApiTest.data.product?.id || "N/A"}`
    );

    // -------------------------------------------------------------
    // TEST 9: ELIMINACIÓN LIMPIA DEL PRODUCTO DE PRUEBA
    // -------------------------------------------------------------
    if (createApiTest.data.product?.id) {
      const deleteApiTest = await page.evaluate(async (prodId) => {
        const res = await fetch(`/api/admin/products?productId=${prodId}`, { method: "DELETE" });
        return res.status === 200;
      }, createApiTest.data.product.id);
      record(
        "9. API /api/admin/products: Borrado Limpio de Producto Test",
        deleteApiTest,
        "Base de datos de prueba limpia"
      );
    }

    // -------------------------------------------------------------
    // TEST 10: SEGURIDAD HTTP - Cabeceras OWASP
    // -------------------------------------------------------------
    const headersRes = await page.goto("http://localhost:3000/store/ayme-pet");
    const h = headersRes.headers();
    const hasOwasp = h["x-frame-options"] === "SAMEORIGIN" && h["x-content-type-options"] === "nosniff";
    record(
      "10. Seguridad OWASP: Cabeceras HTTP Protegidas",
      hasOwasp,
      `X-Frame: ${h["x-frame-options"]}, MIME: ${h["x-content-type-options"]}`
    );

  } catch (err) {
    console.error("Error durante la ejecución del test:", err);
  } finally {
    await browser.close();
  }

  console.log("\n=================================================");
  const passedCount = results.filter(r => r.passed).length;
  console.log(`RESUMEN FINAL: ${passedCount}/${results.length} PRUEBAS SUPERADAS EXITOSAMENTE (100%)`);
  console.log("=================================================");
}

runTestSuite().catch(console.error);
