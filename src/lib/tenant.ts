import { supabase, getAdminClient } from './supabase';
import { Tenant, Branch, Category, Product } from './types';

export async function getTenantByHostOrSlug(hostOrSlug: string): Promise<Tenant | null> {
  const admin = getAdminClient();
  const clean = hostOrSlug.toLowerCase().trim();

  // 1. Buscar por slug directo
  const { data: tenantBySlug } = await admin
    .from('tenants')
    .select('*')
    .eq('slug', clean)
    .single();

  if (tenantBySlug) return tenantBySlug as Tenant;

  // 2. Si no es slug directo, buscar en tenant_domains (ej: ayme.tenddy.shop o plastpet.localhost)
  const { data: domainRecord } = await admin
    .from('tenant_domains')
    .select('tenant_id')
    .eq('domain', clean)
    .single();

  if (domainRecord?.tenant_id) {
    const { data: tenant } = await admin
      .from('tenants')
      .select('*')
      .eq('id', domainRecord.tenant_id)
      .single();
    if (tenant) return tenant as Tenant;
  }

  // 3. Fallback: retornar el primer tenant activo si estamos en desarrollo
  const { data: fallback } = await admin
    .from('tenants')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  return fallback as Tenant | null;
}

export async function getTenantCatalog(tenantId: string) {
  const admin = getAdminClient();

  const [categoriesRes, productsRes, branchesRes] = await Promise.all([
    admin.from('categories').select('*').eq('tenant_id', tenantId).order('name'),
    admin.from('products').select('*').eq('tenant_id', tenantId).eq('is_active', true),
    admin.from('branches').select('*').eq('tenant_id', tenantId).eq('is_active', true),
  ]);

  return {
    categories: (categoriesRes.data || []) as Category[],
    products: (productsRes.data || []) as Product[],
    branches: (branchesRes.data || []) as Branch[],
  };
}
