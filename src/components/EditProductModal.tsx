'use client';

import React from 'react';
import { Category, Product, Tenant } from '@/lib/types';
import ProductEditorView from './ProductEditorView';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  onProductUpdated: (updatedProduct: Product) => void;
  tenant: Tenant;
}

export default function EditProductModal({
  isOpen,
  onClose,
  product,
  categories,
  onProductUpdated,
  tenant,
}: EditProductModalProps) {
  if (!isOpen || !product) return null;

  return (
    <ProductEditorView
      tenant={tenant}
      product={product}
      categories={categories}
      onBack={onClose}
      onProductSaved={(updatedProd) => {
        onProductUpdated(updatedProd);
        onClose();
      }}
    />
  );
}
