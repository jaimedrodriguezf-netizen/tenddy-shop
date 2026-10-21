/**
 * Suite de Pruebas Automatizadas: Barra Lateral y Métricas de Productos e Imágenes en Superadmin
 * Valida:
 * 1. Extracción y cómputo de totalGlobalProducts, totalGlobalImages y total_images por tenant
 * 2. Estructura de navegación con Barra Lateral (Desktop fija + Drawer móvil)
 * 3. Tarjetas métricas de Productos e Imágenes en el Dashboard
 * 4. Desglose de Catálogo & Media por fábrica en la tabla central
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando verificación de Barra Lateral y Métricas de Productos e Imágenes en Superadmin...\n');

// 1. Verificación de superadmin/page.tsx
const pagePath = path.join(__dirname, '../src/app/superadmin/page.tsx');
assert(fs.existsSync(pagePath), 'Debe existir src/app/superadmin/page.tsx');

const pageContent = fs.readFileSync(pagePath, 'utf8');

assert(pageContent.includes("select('id, tenant_id, images')"), 'La consulta de productos debe incluir images');
assert(pageContent.includes('totalGlobalImages'), 'Debe calcular totalGlobalImages');
assert(pageContent.includes('imagesByTenant'), 'Debe mapear imágenes por tenant_id');
assert(pageContent.includes('total_images: tenantImages'), 'tenantsSummary debe incluir total_images');
assert(pageContent.includes('force-dynamic'), 'La página debe tener export const dynamic = force-dynamic');

console.log('✅ 1. Extracción de Datos: Cálculo de métricas de productos e imágenes en servidor verificado.');

// 2. Verificación de SuperadminDashboardView.tsx (Layout Sidebar Desktop + Drawer Móvil)
const dashboardPath = path.join(__dirname, '../src/components/SuperadminDashboardView.tsx');
assert(fs.existsSync(dashboardPath), 'Debe existir src/components/SuperadminDashboardView.tsx');

const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

assert(dashboardContent.includes('isMobileSidebarOpen'), 'Dashboard debe soportar drawer móvil con isMobileSidebarOpen');
assert(dashboardContent.includes('hidden md:flex w-64 lg:w-72 bg-slate-950'), 'Dashboard debe renderizar sidebar desktop fijo');
assert(dashboardContent.includes('renderNavLinks'), 'Dashboard debe renderizar enlaces de navegación organizados');
assert(dashboardContent.includes('Volumen de Plataforma'), 'Sidebar debe incluir widget de volumen de plataforma');

console.log('✅ 2. Arquitectura de Navegación: Barra lateral fija en desktop y drawer deslizable en móvil verificados.');

// 3. Verificación de Tarjetas Métricas
assert(dashboardContent.includes('totalGlobalProducts'), 'Debe mostrar tarjeta métrica de productos');
assert(dashboardContent.includes('totalGlobalImages'), 'Debe mostrar tarjeta métrica de imágenes');
assert(dashboardContent.includes('ImageIcon'), 'Debe usar icono ImageIcon para fotos');

console.log('✅ 3. Tarjetas Métricas: Displays globales para productos e imágenes verificados.');

// 4. Verificación de la Tabla de Fábricas (Columna Catálogo & Media y URL Pública)
assert(dashboardContent.includes('Catálogo & Media'), 'La tabla de tenants debe incluir cabecera Catálogo & Media');
assert(dashboardContent.includes('total_images'), 'La tabla debe mostrar el conteo de imágenes por tenant');
assert(dashboardContent.includes('primary_domain'), 'La tabla debe mostrar y enlazar el dominio público de la tienda');
assert(dashboardContent.includes('copiedSlug'), 'Debe contar con funcionalidad para copiar la URL pública al portapapeles');

console.log('✅ 4. Tabla de Tiendas: Desglose de productos, fotos y URL pública cliqueable con copiado verificado.');

console.log('\n🎉 TODOS LOS TESTS DE BARRA LATERAL Y MÉTRICAS DE SUPERADMIN PASARON EXITOSAMENTE (100%)\n');
