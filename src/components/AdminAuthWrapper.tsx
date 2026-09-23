'use client';

import React, { useState } from 'react';
import { Tenant, Branch, Product, Category } from '@/lib/types';
import AdminDashboardView, { QuoteRecord } from './AdminDashboardView';
import AdminLoginForm from './AdminLoginForm';
import { TenantMember } from './TeamTab';

interface AdminAuthWrapperProps {
  shopSlug: string;
  tenant: Tenant;
  branches: Branch[];
  products: Product[];
  categories?: Category[];
  initialQuotes: QuoteRecord[];
  initialMembers?: TenantMember[];
  initiallyAuthenticated: boolean;
}

export default function AdminAuthWrapper({
  shopSlug,
  tenant,
  branches,
  products,
  categories = [],
  initialQuotes,
  initialMembers = [],
  initiallyAuthenticated,
}: AdminAuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(initiallyAuthenticated);

  if (!isAuthenticated) {
    return (
      <AdminLoginForm
        shopSlug={shopSlug}
        tenantName={tenant.name}
        onSuccess={() => {
          setIsAuthenticated(true);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <AdminDashboardView
      tenant={tenant}
      branches={branches}
      products={products}
      categories={categories}
      initialQuotes={initialQuotes}
      initialMembers={initialMembers}
    />
  );
}
