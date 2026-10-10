import { getAdminClient } from './supabase';
import { Tenant, Branch, Category, Product } from './types';

function sanitizeTenant(tenant: any): Tenant | null {
  if (!tenant) return null;
  const sanitized = { ...tenant };
  if (sanitized.settings && typeof sanitized.settings === 'object') {
    const { admin_password_hash, ...safeSettings } = sanitized.settings;
    sanitized.settings = safeSettings;
  }
  return sanitized as Tenant;
}

export async function getTenantByHostOrSlug(hostOrSlug: string): Promise<Tenant | null> {
  const admin = getAdminClient();
  const clean = hostOrSlug.toLowerCase().trim();

  // 1. Buscar por slug directo
  const { data: tenantBySlug } = await admin
    .from('tenants')
    .select('*')
    .eq('slug', clean)
    .single();

  if (tenantBySlug) return sanitizeTenant(tenantBySlug);

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
    if (tenant) return sanitizeTenant(tenant);
  }

  return null;
}

export async function getTenantCatalog(tenantId: string) {
  const admin = getAdminClient();

  const [categoriesRes, productsRes, branchesRes] = await Promise.all([
    admin.from('categories').select('*').eq('tenant_id', tenantId).order('name'),
    admin.from('products').select('*').eq('tenant_id', tenantId).eq('is_active', true).order('created_at', { ascending: false }),
    admin.from('branches').select('*').eq('tenant_id', tenantId).eq('is_active', true),
  ]);

  return {
    categories: (categoriesRes.data || []) as Category[],
    products: (productsRes.data || []) as Product[],
    branches: (branchesRes.data || []) as Branch[],
  };
}
