'use client';

import React from 'react';
import ProductDetailView from './ProductDetailView';
import { Product, Tenant, Branch, Category } from '@/lib/types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  tenant: Tenant;
  selectedBranch: Branch | null;
  branches?: Branch[];
  categories?: Category[];
}

export default function ProductDetailModal({
  product,
  onClose,
  tenant,
  selectedBranch,
  branches = [],
  categories = [],
}: ProductDetailModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs">
      <ProductDetailView
        product={product}
        onBack={onClose}
        tenant={tenant}
        selectedBranch={selectedBranch}
        branches={branches.length > 0 ? branches : [selectedBranch].filter(Boolean) as Branch[]}
        categories={categories}
      />
    </div>
  );
}
