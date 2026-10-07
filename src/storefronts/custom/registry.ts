import React from 'react';
import { Tenant, Product, Category, Branch } from '@/lib/types';
import AymeStorefront from './ayme-pet/AymeStorefront';

export interface CustomStorefrontProps {
  tenant: Tenant;
  products: Product[];
  categories: Category[];
  branches: Branch[];
  isAdmin: boolean;
}

// Diccionario canónico de tiendas y temas personalizados (Enterprise / Custom)
export const CUSTOM_THEMES: Record<string, React.ComponentType<CustomStorefrontProps>> = {
  'ayme-pet': AymeStorefront,
};
