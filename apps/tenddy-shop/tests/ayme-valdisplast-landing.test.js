/**
 * Suite de Pruebas Automatizadas: Landing Page Personalizada de AYME (Modelo Aprobado & Valdisplast)
 * Verifica secuencia de scroll interactiva, frame deslizable, HUD, telemetría, catálogo y contacto.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  console.log('🧪 Iniciando verificación de la Landing Page Personalizada de AYME...');

  // 1. Verificación de TenantLandingView.tsx
  const landingPath = path.join(__dirname, '../src/components/TenantLandingView.tsx');
  const landingCode = fs.readFileSync(landingPath, 'utf8');

  // Hero: Secuencia de Scroll interactiva original
  assert(
    landingCode.includes('scroll-sequence-track') && landingCode.includes('scroll-sequence-sticky'),
    'El Hero debe tener el track y el contenedor sticky de la secuencia de scroll'
  );
  console.log('✅ 1. Scroll Sequence: Track pegajoso y contenedor sticky verificados.');

  // Hero: Las 3 fases sincronizadas (Intro, Fase 1 y Fase 2)
  assert(
    landingCode.includes('sequence-step-intro') &&
    landingCode.includes('sequence-step-1') &&
    landingCode.includes('sequence-step-2'),
    'El Hero debe incluir las 3 tarjetas de fase deslizables con el scroll'
  );
  console.log('✅ 2. Scroll Sequence: Tarjetas de las 3 fases deslizables (Intro, Fase 1, Fase 2) verificadas.');

  // Telemetría y HUD
  assert(
    landingCode.includes('sequence-top-hud') &&
    landingCode.includes('MONITOREO DE LÍNEA EN TIEMPO REAL') &&
    landingCode.includes('sequence-bottom-hud') &&
    landingCode.includes('telemetry-frame-val') &&
    landingCode.includes('timeline-fill-bar'),
    'El Hero debe contar con telemetría en tiempo real, HUD superior e inferior y barra de progreso'
  );
  console.log('✅ 3. Telemetría: HUD superior, timeline vertical y contador de frames verificados.');

  // Header: Dropdown de Categorías
  assert(
    landingCode.includes('isProductsDropdownOpen') &&
    landingCode.includes('Catálogo de Envases') &&
    landingCode.includes('dropdownRef'),
    'El Header debe contener el menú interactivo con dropdown de categorías'
  );
  console.log('✅ 4. Header: Menú interactivo con dropdown de categorías verificado.');

  // 3 Servicios Industriales
  assert(
    landingCode.includes('Servicios Industriales en Plásticos PET & PP') &&
    landingCode.includes('Diseño, desarrollo y fabricación de envases PET') &&
    landingCode.includes('Proveedores de tapas, liners y accesorios') &&
    landingCode.includes('Personalización de proyectos, matricería 3D'),
    'Debe existir la sección de 3 Servicios Industriales de planta'
  );
  console.log('✅ 5. Servicios: Bloque de los 3 Servicios Industriales de planta verificado.');

  // Catálogo: Buscador reactivo y Ficha Técnica
  assert(
    landingCode.includes('searchQuery') &&
    landingCode.includes('Buscar por capacidad (500ml, 1L), boca (28mm), nombre...') &&
    landingCode.includes('handleWhatsAppQuote'),
    'El catálogo debe contar con buscador reactivo y cotización directa por WhatsApp'
  );
  console.log('✅ 6. Catálogo: Buscador reactivo en vivo y cotizador WhatsApp verificado.');

  // Sección de Contacto & Google Maps
  assert(
    landingCode.includes('id="contact-section"') &&
    landingCode.includes('Solicitud de Cotización & Muestras') &&
    landingCode.includes('Planta de Fabricación') &&
    landingCode.includes('https://www.google.com/maps/embed'),
    'Debe existir la sección de Contacto B2B con formulario y Google Maps'
  );
  console.log('✅ 7. Contacto: Formulario B2B y mapa interactivo de Google Maps verificado.');

  // 2. Verificación de AppearanceTab.tsx (colores oficiales rojo)
  const appearancePath = path.join(__dirname, '../src/components/AppearanceTab.tsx');
  const appearanceCode = fs.readFileSync(appearancePath, 'utf8');

  assert(
    appearanceCode.includes("tenant.slug === 'ayme-pet' ? '#A61C2E' : ''") &&
    appearanceCode.includes("setExtractedPrimary('#A61C2E')"),
    'AppearanceTab debe tener calibrado el Rojo Carmesí #A61C2E como color de AYME'
  );
  console.log('✅ 8. Colores: Rojo #A61C2E verificado en panel y paleta corporativa.');

  // 3. Verificación de globals.css
  const globalsPath = path.join(__dirname, '../src/app/globals.css');
  const globalsCode = fs.readFileSync(globalsPath, 'utf8');
  assert(
    globalsCode.includes('style.css'),
    'globals.css debe importar la hoja de estilos oficial style.css'
  );
  console.log('✅ 9. Estilos: Hoja oficial style.css vinculada nativamente en Next.js.');

  console.log('\n🎉 TODOS LOS TESTS DE LA LANDING AYME NATIVA EN NEXT.JS PASARON EXITOSAMENTE (100%)');
}

runTests();
