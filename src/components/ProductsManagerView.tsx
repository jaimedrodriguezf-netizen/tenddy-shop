'use client';

import React, { useState, useMemo } from 'react';
import {
  Trash2,
  Boxes,
  ExternalLink,
  Star,
  Check,
  X,
  Loader2,
  FileSpreadsheet,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import writeXlsxFile from 'write-excel-file/browser';
import { Tenant, Category, Product } from '@/lib/types';
import { translateErrorMessage } from '@/lib/error-translator';

interface ProductsManagerViewProps {
  tenant: Tenant;
  products: Product[];
  categories: Category[];
  onProductsChanged: (products: Product[]) => void;
  onOpenCreateModal: () => void;
  onOpenBulkModal: () => void;
  onEditProduct: (product: Product) => void;
}

export default function ProductsManagerView({
  tenant,
  products,
  categories,
  onProductsChanged,
  onOpenCreateModal,
  onOpenBulkModal,
  onEditProduct,
}: ProductsManagerViewProps) {
  // Estados de Filtros y Búsqueda
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'featured' | 'out_of_stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  // Estados de Selección Múltiple y Acciones en Lote
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Estados de Edición Rápida (WordPress Quick Edit)
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickName, setQuickName] = useState('');
  const [quickSlug, setQuickSlug] = useState('');
  const [quickSku, setQuickSku] = useState('');
  const [quickCategoryId, setQuickCategoryId] = useState<string>('');
  const [quickInStock, setQuickInStock] = useState(true);
  const [quickIsFeatured, setQuickIsFeatured] = useState(false);
  const [savingQuickEdit, setSavingQuickEdit] = useState(false);

  // Eliminación individual y duplicación
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Paginación
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Alertas
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Mapa de categorías para acceso O(1)
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Contadores de estado
  const publishedCount = products.length;
  const featuredCount = useMemo(() => {
    return products.filter((p) => Boolean(p.attributes?.featured || p.attributes?.badge?.includes('estrella'))).length;
  }, [products]);

  // Filtrado reactivo de productos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Filtro de Búsqueda
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        const matchesDesc = p.description ? p.description.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesSku && !matchesDesc) return false;
      }

      // 2. Filtro de Categoría
      if (categoryFilter !== 'all') {
        if (p.category_id !== categoryFilter) return false;
      }

      // 3. Filtro de Estado Superior
      const isFeatured = Boolean(p.attributes?.featured || p.attributes?.badge?.includes('estrella'));
      const isOutOfStock = p.attributes?.in_stock === false;

      if (statusFilter === 'featured' && !isFeatured) return false;
      if (statusFilter === 'out_of_stock' && !isOutOfStock) return false;

      // 4. Filtro de Inventario
      if (stockFilter === 'in_stock' && isOutOfStock) return false;
      if (stockFilter === 'out_of_stock' && !isOutOfStock) return false;

      return true;
    });
  }, [products, searchQuery, categoryFilter, statusFilter, stockFilter]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  // Checkbox Seleccionar Todo
  const isAllSelected = paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.has(p.id));

  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (isAllSelected) {
      paginatedProducts.forEach((p) => next.delete(p.id));
    } else {
      paginatedProducts.forEach((p) => next.add(p.id));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Abrir Edición Rápida (WordPress Quick Edit)
  const handleStartQuickEdit = (p: Product) => {
    setQuickEditId(p.id);
    setQuickName(p.name);
    setQuickSlug(p.slug);
    setQuickSku(p.sku || '');
    setQuickCategoryId(p.category_id || '');
    setQuickInStock(p.attributes?.in_stock !== false);
    setQuickIsFeatured(Boolean(p.attributes?.featured || p.attributes?.badge?.includes('estrella')));
    setErrorMsg(null);
  };

  // Guardar Edición Rápida
  const handleSaveQuickEdit = async (p: Product) => {
    if (!quickName.trim()) return;

    try {
      setSavingQuickEdit(true);
      setErrorMsg(null);

      const updatePayload = {
        id: p.id,
        name: quickName.trim(),
        slug: quickSlug.trim() || p.slug,
        sku: quickSku.trim() || p.sku,
        category_id: quickCategoryId || null,
        attributes: {
          ...p.attributes,
          in_stock: quickInStock,
          featured: quickIsFeatured,
          badge: quickIsFeatured ? '5 Estrellas' : (p.attributes?.badge === '5 Estrellas' ? null : p.attributes?.badge),
        },
      };

      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar producto');

      const updated = products.map((item) => (item.id === p.id ? data.product : item));
      onProductsChanged(updated);
      setSuccessMsg(`Producto "${quickName.trim()}" actualizado`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setQuickEditId(null);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo guardar la edición rápida');
      setErrorMsg(msg);
    } finally {
      setSavingQuickEdit(false);
    }
  };

  // Conmutar producto destacado con un clic en la estrella
  const handleToggleFeatured = async (p: Product) => {
    try {
      const currentFeatured = Boolean(p.attributes?.featured || p.attributes?.badge?.includes('estrella'));
      const nextFeatured = !currentFeatured;

      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: p.id,
          attributes: {
            ...p.attributes,
            featured: nextFeatured,
            badge: nextFeatured ? '5 Estrellas' : (p.attributes?.badge === '5 Estrellas' ? null : p.attributes?.badge),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar destacado');

      const updated = products.map((item) => (item.id === p.id ? data.product : item));
      onProductsChanged(updated);
      setSuccessMsg(`Producto ${nextFeatured ? 'destacado' : 'desmarcado'}`);
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo cambiar el estado destacado');
      setErrorMsg(msg);
    }
  };

  // Duplicar producto
  const handleDuplicateProduct = async (p: Product) => {
    try {
      setDuplicatingId(p.id);
      setErrorMsg(null);

      const copySku = p.sku ? `${p.sku}-COPIA` : `SKU-${Date.now().toString().slice(-4)}`;
      const copyPayload = {
        tenant_id: tenant.id,
        category_id: p.category_id || null,
        name: `${p.name} (Copia)`,
        sku: copySku,
        description: p.description || null,
        min_order_qty: p.min_order_qty || 1,
        units_per_package: p.units_per_package || 1,
        attributes: p.attributes || {},
        images: p.images || [],
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al duplicar producto');

      const updated = [data.product, ...products];
      onProductsChanged(updated);
      setSuccessMsg(`Producto duplicado como "${data.product.name}"`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo duplicar el producto');
      setErrorMsg(msg);
    } finally {
      setDuplicatingId(null);
    }
  };

  // Eliminar producto individual
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;

    try {
      setDeletingLoading(true);
      setErrorMsg(null);

      const res = await fetch(`/api/admin/products?productId=${deletingProduct.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar producto');

      const updated = products.filter((p) => p.id !== deletingProduct.id);
      onProductsChanged(updated);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingProduct.id);
        return next;
      });

      setSuccessMsg(`Producto "${deletingProduct.name}" movido a la papelera`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setDeletingProduct(null);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo eliminar el producto');
      setErrorMsg(msg);
    } finally {
      setDeletingLoading(false);
    }
  };

  // Acciones en Lote (Bulk Actions)
  const handleApplyBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;

    try {
      setBulkLoading(true);
      setErrorMsg(null);

      const idsToProcess = Array.from(selectedIds);

      if (bulkAction === 'trash') {
        if (!confirm(`¿Mover los ${idsToProcess.length} productos seleccionados a la papelera?`)) {
          setBulkLoading(false);
          return;
        }

        for (const id of idsToProcess) {
          await fetch(`/api/admin/products?productId=${id}`, { method: 'DELETE' });
        }

        const updated = products.filter((p) => !selectedIds.has(p.id));
        onProductsChanged(updated);
        setSelectedIds(new Set());
        setSuccessMsg(`${idsToProcess.length} productos eliminados`);
      } else if (bulkAction === 'feature') {
        for (const id of idsToProcess) {
          const prod = products.find((p) => p.id === id);
          if (prod) {
            await fetch('/api/admin/products', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id,
                attributes: { ...prod.attributes, featured: true, badge: '5 Estrellas' },
              }),
            });
          }
        }

        const updated = products.map((p) =>
          selectedIds.has(p.id)
            ? { ...p, attributes: { ...p.attributes, featured: true, badge: '5 Estrellas' } }
            : p
        );
        onProductsChanged(updated);
        setSelectedIds(new Set());
        setSuccessMsg(`${idsToProcess.length} productos marcados como destacados`);
      } else if (bulkAction === 'unfeature') {
        for (const id of idsToProcess) {
          const prod = products.find((p) => p.id === id);
          if (prod) {
            await fetch('/api/admin/products', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id,
                attributes: { ...prod.attributes, featured: false, badge: null },
              }),
            });
          }
        }

        const updated = products.map((p) =>
          selectedIds.has(p.id)
            ? { ...p, attributes: { ...p.attributes, featured: false, badge: undefined } }
            : p
        );
        onProductsChanged(updated);
        setSelectedIds(new Set());
        setSuccessMsg(`${idsToProcess.length} productos desmarcados`);
      }

      setBulkAction('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'Error al ejecutar acción en lote');
      setErrorMsg(msg);
    } finally {
      setBulkLoading(false);
    }
  };

  // Exportar catálogo completo a Excel (.xlsx nativo)
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      setErrorMsg(null);

      const schema = [
        { column: 'ID', width: 36, value: (p: Product) => p.id },
        { column: 'SKU', width: 16, value: (p: Product) => p.sku || '' },
        { column: 'Nombre', width: 35, value: (p: Product) => p.name },
        { column: 'Categoría', width: 25, value: (p: Product) => categoryMap.get(p.category_id || '')?.name || 'Sin categorizar' },
        { column: 'Estado Inventario', width: 18, value: (p: Product) => (p.attributes?.in_stock === false ? 'Agotado' : 'Hay existencias') },
        { column: 'Destacado', width: 12, value: (p: Product) => (p.attributes?.featured ? 'Sí' : 'No') },
        { column: 'Pedido Mínimo', width: 15, value: (p: Product) => p.min_order_qty || 1 },
        { column: 'Unidades por Fardo', width: 18, value: (p: Product) => p.units_per_package || 1 },
        { column: 'Descripción', width: 45, value: (p: Product) => p.description || '' },
        { column: 'URL Foto Principal', width: 50, value: (p: Product) => p.images?.[0] || '' },
      ];

      const headerRow = schema.map((s) => ({
        value: s.column,
        fontWeight: 'bold',
        backgroundColor: '#0f172a',
        color: '#ffffff',
      }));

      const dataRows = products.map((p) =>
        schema.map((s) => ({
          value: s.value(p),
        }))
      );

      const filename = `${tenant.slug}-productos-${new Date().toISOString().split('T')[0]}.xlsx`;
      await writeXlsxFile([headerRow, ...dataRows], {
        columns: schema.map((s) => ({ width: s.width })),
        fileName: filename,
      } as any);

      setSuccessMsg(`Catálogo exportado exitosamente (${products.length} productos)`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo exportar el catálogo a Excel');
      setErrorMsg(msg);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '07/10/2026';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} a las ${hours}:${mins}`;
    } catch {
      return 'Publicada';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
      {/* =========================================================================
          1. CABECERA OFICIAL WOOCOMMERCE
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Productos
          </h2>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              Añadir un nuevo producto
            </button>
            <button
              type="button"
              onClick={onOpenBulkModal}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200 flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Importar</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting || products.length === 0}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200 flex items-center gap-1"
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-sky-600" />}
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          2. BARRA DE ESTADOS SUPERIOR (TODO | PUBLICADO | DESTACADOS)
          ========================================================================= */}
      <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
        <span className="text-slate-400 font-medium">Filtrar productos:</span>
        <button
          type="button"
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={`cursor-pointer ${statusFilter === 'all' ? 'font-bold text-slate-900 underline' : 'hover:text-slate-800'}`}
        >
          Todo ({products.length})
        </button>
        <span>|</span>
        <button
          type="button"
          onClick={() => { setStatusFilter('published'); setPage(1); }}
          className={`cursor-pointer ${statusFilter === 'published' ? 'font-bold text-slate-900 underline' : 'hover:text-slate-800'}`}
        >
          Publicado ({publishedCount})
        </button>
        <span>|</span>
        <button
          type="button"
          onClick={() => { setStatusFilter('featured'); setPage(1); }}
          className={`cursor-pointer ${statusFilter === 'featured' ? 'font-bold text-slate-900 underline' : 'hover:text-slate-800'}`}
        >
          Destacado ({featuredCount})
        </button>
      </div>

      {/* =========================================================================
          3. BARRA DE ACCIONES EN LOTE Y FILTROS
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
        {/* Acciones en Lote + Filtros Select */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer font-medium"
          >
            <option value="">Acciones en lote</option>
            <option value="trash">Mover a la papelera</option>
            <option value="feature">Marcar como destacado</option>
            <option value="unfeature">Quitar de destacados</option>
          </select>

          <button
            type="button"
            onClick={handleApplyBulkAction}
            disabled={bulkLoading || !bulkAction || selectedIds.size === 0}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            {bulkLoading ? 'Aplicando...' : 'Aplicar'}
          </button>

          {/* Filtro por Categoría con Guiones */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer font-medium"
          >
            <option value="all">Selecciona una categoría</option>
            {categories.map((c) => {
              const depth = c.parent_id ? (categories.some((p) => p.id === c.parent_id && p.parent_id) ? 3 : 2) : 1;
              const prefix = depth === 1 ? '' : depth === 2 ? '— ' : '—— ';
              return (
                <option key={c.id} value={c.id}>
                  {prefix}{c.name}
                </option>
              );
            })}
          </select>

          {/* Filtro por Inventario */}
          <select
            value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value as any); setPage(1); }}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer font-medium"
          >
            <option value="all">Filtrar por el estado del inventario</option>
            <option value="in_stock">Hay existencias</option>
            <option value="out_of_stock">Agotado</option>
          </select>

          {/* Botón Filtrar */}
          <button
            type="button"
            onClick={() => {
              setSearchQuery(searchInput);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            Filtrar
          </button>

          {(categoryFilter !== 'all' || stockFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all');
                setStockFilter('all');
                setSearchQuery('');
                setSearchInput('');
                setStatusFilter('all');
                setPage(1);
              }}
              className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
            >
              Restablecer
            </button>
          )}
        </div>

        {/* Buscador de productos */}
        <div className="flex items-center gap-1.5 text-xs">
          <label className="text-slate-500 font-medium hidden sm:inline">Buscar productos:</label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchQuery(searchInput);
                setPage(1);
              }
            }}
            placeholder="Nombre o SKU..."
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800 w-44 sm:w-56"
          />
          <button
            type="button"
            onClick={() => {
              setSearchQuery(searchInput);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Contador de elementos */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>{filteredProducts.length} {filteredProducts.length === 1 ? 'elemento' : 'elementos'}</span>

        {/* Paginación Superior */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 mr-2">
              Página {safePage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          4. TABLA OFICIAL DE PRODUCTOS WOOCOMMERCE
          ========================================================================= */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 select-none">
              <tr>
                <th className="py-2.5 px-3 text-center w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3 text-center w-12">Imagen</th>
                <th className="py-2.5 px-3">Nombre</th>
                <th className="py-2.5 px-3 font-mono">SKU</th>
                <th className="py-2.5 px-3">Inventario</th>
                <th className="py-2.5 px-3">Precio</th>
                <th className="py-2.5 px-3">Categorías</th>
                <th className="py-2.5 px-3">Etiquetas</th>
                <th className="py-2.5 px-3">Marcas</th>
                <th className="py-2.5 px-3 text-center w-10">Destacado</th>
                <th className="py-2.5 px-3">Fecha</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Boxes className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                    <p className="font-semibold text-slate-700">No se encontraron productos</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Prueba ajustando los filtros o añade un nuevo producto arriba.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isChecked = selectedIds.has(p.id);
                  const isQuickEditing = quickEditId === p.id;
                  const isFeatured = Boolean(p.attributes?.featured || p.attributes?.badge?.includes('estrella'));
                  const inStock = p.attributes?.in_stock !== false;
                  const categoryName = categoryMap.get(p.category_id || '')?.name || 'Sin categorizar';
                  const shortId = p.id.split('-')[0] || p.id.slice(0, 8);

                  return (
                    <React.Fragment key={p.id}>
                      <tr className={`hover:bg-slate-50/80 transition-colors group ${isChecked ? 'bg-sky-50/40' : ''}`}>
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectOne(p.id)}
                            className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Imagen Miniatura */}
                        <td className="py-3 px-3 text-center">
                          <div className="w-10 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mx-auto p-0.5 flex items-center justify-center shadow-2xs">
                            <img
                              src={p.images?.[0] || '/assets/products/ayme-001.svg'}
                              alt={p.name}
                              loading="lazy"
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        </td>

                        {/* Nombre + Row Actions de WordPress */}
                        <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                          <div className="space-y-1">
                            <span
                              onClick={() => onEditProduct(p)}
                              className="text-slate-900 font-bold hover:text-sky-600 transition-colors cursor-pointer block leading-snug"
                            >
                              {p.name}
                            </span>

                            {/* Row Actions de WordPress (visibles en hover / permanentemente útiles) */}
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal flex-wrap">
                              <span className="font-mono text-slate-400">ID: {shortId}</span>
                              <span className="text-slate-200">|</span>
                              <button
                                type="button"
                                onClick={() => onEditProduct(p)}
                                className="text-sky-600 hover:text-sky-800 font-semibold cursor-pointer"
                              >
                                Editar
                              </button>
                              <span className="text-slate-200">|</span>
                              <button
                                type="button"
                                onClick={() => handleStartQuickEdit(p)}
                                className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                              >
                                Edición rápida
                              </button>
                              <span className="text-slate-200">|</span>
                              <button
                                type="button"
                                onClick={() => setDeletingProduct(p)}
                                className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                              >
                                Papelera
                              </button>
                              <span className="text-slate-200">|</span>
                              <a
                                href={`/store/${tenant.slug}/producto/${p.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-0.5"
                              >
                                <span>Ver</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                              <span className="text-slate-200">|</span>
                              <button
                                type="button"
                                disabled={duplicatingId === p.id}
                                onClick={() => handleDuplicateProduct(p)}
                                className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer flex items-center gap-0.5"
                              >
                                {duplicatingId === p.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null}
                                <span>Duplicar</span>
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {p.sku || <span className="text-slate-300">—</span>}
                        </td>

                        {/* Inventario */}
                        <td className="py-3 px-3">
                          {inStock ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                              Hay existencias
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[10px]">
                              Agotado
                            </span>
                          )}
                        </td>

                        {/* Precio */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                          {p.attributes?.price ? (
                            <span className="font-bold text-slate-900">${p.attributes.price}</span>
                          ) : (
                            <span className="text-slate-400 italic">Cotizar</span>
                          )}
                        </td>

                        {/* Categorías */}
                        <td className="py-3 px-3 text-slate-700">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/80 text-[10px] font-medium">
                            {categoryName}
                          </span>
                        </td>

                        {/* Etiquetas */}
                        <td className="py-3 px-3 text-slate-400">
                          {p.attributes?.badge ? (
                            <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[10px]">
                              {p.attributes.badge}
                            </span>
                          ) : (
                            <span>—</span>
                          )}
                        </td>

                        {/* Marcas */}
                        <td className="py-3 px-3 text-slate-600 text-[11px]">
                          {tenant.name || '—'}
                        </td>

                        {/* Destacado */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(p)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer"
                            title={isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isFeatured ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-slate-400'
                              }`}
                            />
                          </button>
                        </td>

                        {/* Fecha */}
                        <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="text-slate-400 font-medium block text-[10px]">Publicada</span>
                            <span>{formatDate((p as any).created_at)}</span>
                          </div>
                        </td>
                      </tr>

                      {/* =========================================================================
                          FILA DE EDICIÓN RÁPIDA (WORDPRESS QUICK EDIT)
                          ========================================================================= */}
                      {isQuickEditing && (
                        <tr className="bg-slate-50/95 border-y-2 border-slate-300">
                          <td colSpan={11} className="p-4">
                            <div className="space-y-3 max-w-4xl">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
                                  <span>Edición rápida</span>
                                </h4>
                                <span className="text-[11px] text-slate-400">Editando SKU: {p.sku}</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                {/* Bloque 1: Título, Slug y SKU */}
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-slate-700 font-bold mb-0.5 text-[11px]">Título *</label>
                                    <input
                                      type="text"
                                      value={quickName}
                                      onChange={(e) => setQuickName(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-slate-700 font-bold mb-0.5 text-[11px]">Slug</label>
                                    <input
                                      type="text"
                                      value={quickSlug}
                                      onChange={(e) => setQuickSlug(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:border-slate-800"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-slate-700 font-bold mb-0.5 text-[11px]">SKU</label>
                                    <input
                                      type="text"
                                      value={quickSku}
                                      onChange={(e) => setQuickSku(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:border-slate-800"
                                    />
                                  </div>
                                </div>

                                {/* Bloque 2: Categoría */}
                                <div className="space-y-2">
                                  <label className="block text-slate-700 font-bold mb-0.5 text-[11px]">Categorías</label>
                                  <select
                                    value={quickCategoryId}
                                    onChange={(e) => setQuickCategoryId(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800 cursor-pointer"
                                  >
                                    <option value="">Sin categorizar</option>
                                    {categories.map((c) => {
                                      const depth = c.parent_id ? (categories.some((p) => p.id === c.parent_id && p.parent_id) ? 3 : 2) : 1;
                                      const prefix = depth === 1 ? '' : depth === 2 ? '— ' : '—— ';
                                      return (
                                        <option key={c.id} value={c.id}>
                                          {prefix}{c.name}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>

                                {/* Bloque 3: Estado de Inventario y Destacado */}
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">Estado del inventario</label>
                                    <select
                                      value={quickInStock ? 'in_stock' : 'out_of_stock'}
                                      onChange={(e) => setQuickInStock(e.target.value === 'in_stock')}
                                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800 cursor-pointer"
                                    >
                                      <option value="in_stock">Hay existencias</option>
                                      <option value="out_of_stock">Agotado</option>
                                    </select>
                                  </div>

                                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                                    <input
                                      type="checkbox"
                                      checked={quickIsFeatured}
                                      onChange={(e) => setQuickIsFeatured(e.target.checked)}
                                      className="rounded border-slate-300 text-sky-600 focus:ring-0 cursor-pointer"
                                    />
                                    <span className="font-semibold text-slate-800 text-xs">Destacado (5 Estrellas)</span>
                                  </label>
                                </div>
                              </div>

                              {/* Botones de Edición Rápida */}
                              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setQuickEditId(null)}
                                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  disabled={savingQuickEdit || !quickName.trim()}
                                  onClick={() => handleSaveQuickEdit(p)}
                                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                >
                                  {savingQuickEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  <span>Actualizar</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación Inferior y Resumen */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
        <span>Mostrando {paginatedProducts.length} de {filteredProducts.length} productos</span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(1)}
              className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 cursor-pointer font-bold"
            >
              «
            </button>
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono font-bold text-slate-700">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(totalPages)}
              className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 cursor-pointer font-bold"
            >
              »
            </button>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Eliminación Individual */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-slate-900">¿Mover a papelera?</h4>
                <p className="text-xs text-slate-500">Esta acción eliminará el producto del catálogo.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Vas a eliminar el producto <strong>&ldquo;{deletingProduct.name}&rdquo;</strong> (SKU: {deletingProduct.sku || 'N/A'}).
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={deletingLoading}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {deletingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Mover a papelera</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
