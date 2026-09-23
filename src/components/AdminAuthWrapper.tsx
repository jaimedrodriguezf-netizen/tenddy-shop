'use client';

import React, { useState } from 'react';
import { Tenant, Branch, Product, Category } from '@/lib/types';
import AdminDashboardView, { QuoteRecord } from './AdminDashboardView';
import AdminLoginForm from './AdminLoginForm';

interface AdminAuthWrapperProps {
  shopSlug: string;
  tenant: Tenant;
  branches: Branch[];
  products: Product[];
  categories?: Category[];
  initialQuotes: QuoteRecord[];
  initiallyAuthenticated: boolean;
}

export default function AdminAuthWrapper({
  shopSlug,
  tenant,
  branches,
  products,
  categories = [],
  initialQuotes,
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
    />
  );
}
