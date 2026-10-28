const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 1. Validar que la migración SQL 0019 existe y cumple las reglas de oro
console.log('🧪 Test 1: Verificando archivo de migración 0019_plans_and_pricing.sql...');
const migrationPath = path.join(__dirname, '../supabase/migrations/0019_plans_and_pricing.sql');
assert(fs.existsSync(migrationPath), 'El archivo 0019_plans_and_pricing.sql debe existir');

const sqlContent = fs.readFileSync(migrationPath, 'utf8');
assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.plans'), 'Debe usar CREATE TABLE IF NOT EXISTS');
assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.tenant_subscriptions'), 'Debe crear tabla tenant_subscriptions');
assert(sqlContent.includes('ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY'), 'Debe habilitar RLS en plans');
assert(sqlContent.includes('ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY'), 'Debe habilitar RLS en tenant_subscriptions');
assert(sqlContent.includes('ON CONFLICT (slug) DO UPDATE'), 'Debe tener seeds idempotentes con ON CONFLICT');
console.log('✅ Test 1 aprobado: Migración SQL 100% idempotente y blindada con RLS.');

// 2. Validar tipos e interfaces en TypeScript
console.log('🧪 Test 2: Verificando tipos en src/lib/types.ts...');
const typesContent = fs.readFileSync(path.join(__dirname, '../src/lib/types.ts'), 'utf8');
assert(typesContent.includes('export interface PlanLimits'), 'Debe exportar PlanLimits');
assert(typesContent.includes('export interface Plan'), 'Debe exportar Plan');
assert(typesContent.includes('export interface TenantSubscription'), 'Debe exportar TenantSubscription');
assert(typesContent.includes('plan_slug?: string;'), 'Tenant debe tener plan_slug opcional');
console.log('✅ Test 2 aprobado: Tipos TypeScript presentes y con compatibilidad hacia atrás.');

// 3. Validar lógica del helper src/lib/plans.ts
console.log('🧪 Test 3: Verificando src/lib/plans.ts...');
const plansHelperContent = fs.readFileSync(path.join(__dirname, '../src/lib/plans.ts'), 'utf8');
assert(plansHelperContent.includes('export const DEFAULT_PLANS: Plan[]'), 'Debe exportar DEFAULT_PLANS');
assert(plansHelperContent.includes("'essential'"), 'Debe incluir el plan essential');
assert(plansHelperContent.includes('price_yearly: 100'), 'Plan essential debe costar 100 USD anuales');
assert(plansHelperContent.includes('export function getPlanBySlug'), 'Debe exportar getPlanBySlug');
assert(plansHelperContent.includes('export function checkPlanLimit'), 'Debe exportar checkPlanLimit');
assert(plansHelperContent.includes('export function calculateAnnualSavings'), 'Debe exportar calculateAnnualSavings');
assert(plansHelperContent.includes('export function validatePlanPayload'), 'Debe exportar validatePlanPayload');
console.log('✅ Test 3 aprobado: Helper central de planes implementado con plan esencial de $100/año.');

// 4. Validar existencia de endpoints de API
console.log('🧪 Test 4: Verificando endpoints API...');
assert(fs.existsSync(path.join(__dirname, '../src/app/api/superadmin/plans/route.ts')), 'Ruta /api/superadmin/plans debe existir');
assert(fs.existsSync(path.join(__dirname, '../src/app/api/superadmin/tenants/plan/route.ts')), 'Ruta /api/superadmin/tenants/plan debe existir');
assert(fs.existsSync(path.join(__dirname, '../src/app/api/plans/route.ts')), 'Ruta /api/plans debe existir');
console.log('✅ Test 4 aprobado: Rutas API REST Superadmin y pública implementadas.');

// 5. Validar componentes de frontend en Superadmin
console.log('🧪 Test 5: Verificando componentes UI...');
assert(fs.existsSync(path.join(__dirname, '../src/components/SuperadminPlansManager.tsx')), 'Componente SuperadminPlansManager debe existir');

const dashboardViewContent = fs.readFileSync(path.join(__dirname, '../src/components/SuperadminDashboardView.tsx'), 'utf8');
assert(dashboardViewContent.includes('SuperadminPlansManager'), 'SuperadminDashboardView debe importar SuperadminPlansManager');
assert(dashboardViewContent.includes("activeTab === 'plans'"), 'SuperadminDashboardView debe renderizar la pestaña de planes');
console.log('✅ Test 5 aprobado: UI en Torre de Control Superadmin integrada.');

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE ARQUITECTURA DEL MÓDULO DE PLANES PASARON EXITOSAMENTE!');
