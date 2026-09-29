'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
  const [manualAuth, setManualAuth] = useState(false);
  const isAuthenticated = initiallyAuthenticated || manualAuth;

  // Verificación de respaldo en cliente si la sesión está activa en Supabase Auth
  useEffect(() => {
    if (!isAuthenticated) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          // El usuario tiene sesión de Google activa, sincronizar para entrar directamente
          window.location.reload();
        }
      });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <AdminLoginForm
        shopSlug={shopSlug}
        tenantName={tenant.name}
        onSuccess={() => {
          setManualAuth(true);
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
