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
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const isAuthenticated = initiallyAuthenticated || manualAuth;

  // Inspeccionar si hay una sesión activa de Google sin provocar bucle infinito de recargas
  useEffect(() => {
    if (!isAuthenticated) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          setGoogleUserEmail(user.email);
        }
      });
    }
  }, [isAuthenticated]);

  const handleSignOutGoogle = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error cerrando sesión en Supabase:', e);
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await fetch(`/api/admin/auth?shopSlug=${shopSlug}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error limpiando cookies:', e);
    }
    setGoogleUserEmail(null);
    window.location.reload();
  };

  if (!isAuthenticated) {
    return (
      <AdminLoginForm
        shopSlug={shopSlug}
        tenantName={tenant.name}
        activeGoogleEmail={googleUserEmail}
        onSignOutGoogle={handleSignOutGoogle}
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
