'use client';

import React from 'react';
import { Tenant, Category, Product } from '@/lib/types';
import ProductEditorView from './ProductEditorView';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  categories: Category[];
  onProductCreated: (newProduct: Product) => void;
  onCategoryCreated?: (newCategory: Category) => void;
}

export default function CreateProductModal({
  isOpen,
  onClose,
  tenant,
  categories,
  onProductCreated,
  onCategoryCreated,
}: CreateProductModalProps) {
  if (!isOpen) return null;

  return (
    <ProductEditorView
      tenant={tenant}
      categories={categories}
      onBack={onClose}
      onProductSaved={(newProd) => {
        onProductCreated(newProd);
        onClose();
      }}
      onCategoryCreated={onCategoryCreated}
    />
  );
}
