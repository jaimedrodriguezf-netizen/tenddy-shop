'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Boxes,
  X,
  Check,
  RefreshCw,
  Layers,
  Upload,
  Clipboard,
  CornerDownRight,
  FolderTree
} from 'lucide-react';
import { Category } from '@/lib/types';
import { compressImage } from '@/lib/image-compressor';
import { translateErrorMessage } from '@/lib/error-translator';

interface ExtendedCategory extends Category {
  products?: { count: number }[];
}

interface CategoriesManagerViewProps {
  tenantId: string;
  initialCategories: Category[];
  onCategoriesChanged: (categories: Category[]) => void;
  onOpenCreateModal?: () => void;
}

export default function CategoriesManagerView({
  tenantId,
  initialCategories,
  onCategoriesChanged,
  onOpenCreateModal,
}: CategoriesManagerViewProps) {
  const [categories, setCategories] = useState<ExtendedCategory[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [productsFilter, setProductsFilter] = useState<'all' | 'with_products' | 'empty'>('all');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados para modal de edición
  const [editingCategory, setEditingCategory] = useState<ExtendedCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
  const [editImageUrlInput, setEditImageUrlInput] = useState('');
  const [editCurrentImageUrl, setEditCurrentImageUrl] = useState<string | null>(null);
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Estados para crear categoría en página integrada
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createImageBase64, setCreateImageBase64] = useState<string | null>(null);
  const [createImageUrlInput, setCreateImageUrlInput] = useState('');
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [savingCreate, setSavingCreate] = useState(false);

  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    const clean = url.trim();
    if (clean.includes('drive.google.com')) {
      const match = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }
    return clean;
  };

  // Estado para confirmación de eliminación
  const [deletingCat, setDeletingCat] = useState<ExtendedCategory | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Helper para calcular profundidad jerárquica (1: principal, 2: subcategoría, 3: 3er nivel)
  const getCategoryDepth = (cat: Category, allCats: Category[]): number => {
    if (!cat.parent_id) return 1;
    const parent = allCats.find((c) => c.id === cat.parent_id);
    if (!parent) return 1;
    if (!parent.parent_id) return 2;
    return 3;
  };

  const getCategoryParentName = (cat: Category, allCats: Category[]): string | null => {
    if (!cat.parent_id) return null;
    const parent = allCats.find((c) => c.id === cat.parent_id);
    return parent ? parent.name : null;
  };

  // Guardar nueva categoría vía POST
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    try {
      setSavingCreate(true);
      setErrorMsg(null);

      const activeImageUrl = createImageUrlInput.trim()
        ? normalizeImageUrl(createImageUrlInput)
        : undefined;

      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          name: createName.trim(),
          description: createDescription.trim() || null,
          imageData: createImageBase64,
          image_url: !createImageBase64 ? activeImageUrl : undefined,
          parent_id: createParentId && createParentId.trim() ? createParentId.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creando categoría');

      setSuccessMsg(`Categoría "${createName.trim()}" creada exitosamente`);
      setTimeout(() => setSuccessMsg(null), 3000);

      const updated = [...categories, data.category];
      setCategories(updated);
      onCategoriesChanged(updated);

      setCreateName('');
      setCreateDescription('');
      setCreateImageBase64(null);
      setCreateImageUrlInput('');
      setCreateParentId(null);
      setIsCreatingCategory(false);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo crear la categoría');
      setErrorMsg(msg);
    } finally {
      setSavingCreate(false);
    }
  };

  // Cargar categorías con conteo de productos
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/admin/categories?tenantId=${tenantId}&includeInactive=true`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar categorías');
      setCategories(data.categories || []);
      onCategoriesChanged(data.categories || []);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudieron cargar las categorías');
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const loadCategories = async () => {
      try {
        const res = await fetch(`/api/admin/categories?tenantId=${tenantId}&includeInactive=true`);
        const data = await res.json();
        if (!isCancelled && res.ok && data.categories) {
          setCategories(data.categories);
          onCategoriesChanged(data.categories);
        }
      } catch (err) {
        console.error('Error cargando categorías:', err);
      }
    };

    loadCategories();
    return () => {
      isCancelled = true;
    };
  }, [tenantId, onCategoriesChanged]);

  // Abrir modal de edición
  const handleOpenEdit = (cat: ExtendedCategory) => {
    setEditingCategory(cat);
    setEditName(cat.name || '');
    setEditDescription(cat.description || '');
    setEditIsActive(cat.is_active ?? true);
    setEditImageBase64(null);
    setEditImageUrlInput('');
    setEditCurrentImageUrl(cat.image_url || null);
    setEditParentId(cat.parent_id || null);
    setErrorMsg(null);
  };

  // Guardar edición vía PATCH
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;

    try {
      setSavingEdit(true);
      setErrorMsg(null);

      const activeImageUrl = editImageUrlInput.trim()
        ? normalizeImageUrl(editImageUrlInput)
        : editCurrentImageUrl;

      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editName.trim(),
          description: editDescription.trim() || null,
          is_active: editIsActive,
          imageData: editImageBase64,
          image_url: !editImageBase64 ? activeImageUrl : undefined,
          parent_id: editParentId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar categoría');

      setSuccessMsg(`Categoría "${editName.trim()}" actualizada exitosamente`);
      setTimeout(() => setSuccessMsg(null), 3000);

      // Actualizar lista local y global
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? { ...c, ...data.category } : c))
      );
      onCategoriesChanged(
        categories.map((c) => (c.id === editingCategory.id ? { ...c, ...data.category } : c))
      );

      setEditingCategory(null);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo actualizar la categoría');
      setErrorMsg(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  // Toggle rápido de estado activo/inactivo
  const handleToggleActive = async (cat: ExtendedCategory) => {
    try {
      const newStatus = !cat.is_active;
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cat.id,
          is_active: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar estado');

      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: newStatus } : c))
      );
      onCategoriesChanged(
        categories.map((c) => (c.id === cat.id ? { ...c, is_active: newStatus } : c))
      );
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo cambiar el estado de la categoría');
      setErrorMsg(msg);
    }
  };

  // Confirmar y eliminar categoría
  const handleConfirmDelete = async () => {
    if (!deletingCat) return;

    try {
      setDeletingLoading(true);
      setErrorMsg(null);

      const res = await fetch(`/api/admin/categories?categoryId=${deletingCat.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar categoría');

      setSuccessMsg(`Categoría "${deletingCat.name}" eliminada`);
      setTimeout(() => setSuccessMsg(null), 3000);

      const updated = categories.filter((c) => c.id !== deletingCat.id);
      setCategories(updated);
      onCategoriesChanged(updated);
      setDeletingCat(null);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo eliminar la categoría');
      setErrorMsg(msg);
    } finally {
      setDeletingLoading(false);
    }
  };

  // Filtrado reactivo inteligente por buscador y selectores
  const isFiltering =
    searchQuery.trim().length > 0 ||
    statusFilter !== 'all' ||
    productsFilter !== 'all' ||
    showAllCategories;

  const displayedCategories = categories
    .filter((cat) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cat.name?.toLowerCase().includes(q) ||
        cat.slug?.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && cat.is_active) ||
        (statusFilter === 'inactive' && !cat.is_active);

      const prodCount = cat.products?.[0]?.count ?? 0;
      const matchesProducts =
        productsFilter === 'all' ||
        (productsFilter === 'with_products' && prodCount > 0) ||
        (productsFilter === 'empty' && prodCount === 0);

      return matchesSearch && matchesStatus && matchesProducts;
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const totalActive = categories.filter((c) => c.is_active).length;
  const totalProductsCount = categories.reduce((sum, c) => {
    const count = c.products?.[0]?.count || 0;
    return sum + count;
  }, 0);

  // VISTA PÁGINA: CREAR CATEGORÍA (CERO MODAL)
  if (isCreatingCategory) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 text-slate-900 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCreateParentId(null);
                setIsCreatingCategory(false);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              ← Volver a Categorías
            </button>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Nueva Categoría de Catálogo</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ingresa el nombre, descripción y foto para organizar tus prendas.</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveCreate} className="space-y-4 text-xs">
          {/* Foto Circular */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <label className="block text-slate-800 font-bold text-xs">
              Foto Representativa de la Categoría
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-pointer text-xs font-semibold shadow-xs">
                {compressingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" /> : <Upload className="w-3.5 h-3.5 text-slate-500" />}
                <span>{compressingImage ? 'Optimizando...' : 'Subir Foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        setCompressingImage(true);
                        const compressed = await compressImage(file, {
                          maxWidth: 600,
                          maxHeight: 600,
                          quality: 0.85,
                          outputFormat: 'image/webp',
                        });
                        setCreateImageBase64(compressed);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setCompressingImage(false);
                      }
                    }
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={async () => {
                  try {
                    if (typeof navigator !== 'undefined' && navigator.clipboard?.read) {
                      const items = await navigator.clipboard.read();
                      for (const item of items) {
                        const imgType = item.types.find((t) => t.startsWith('image/'));
                        if (imgType) {
                          const blob = await item.getType(imgType);
                          const file = new File([blob], 'cat.png', { type: imgType });
                          const compressed = await compressImage(file, {
                            maxWidth: 600,
                            maxHeight: 600,
                            quality: 0.85,
                            outputFormat: 'image/webp',
                          });
                          setCreateImageBase64(compressed);
                          return;
                        }
                      }
                    }
                    alert('Presiona Ctrl + V para pegar la foto directamente.');
                  } catch {
                    alert('Presiona Ctrl + V para pegar la foto directamente.');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-700 cursor-pointer text-xs font-semibold"
              >
                <Clipboard className="w-3.5 h-3.5 text-sky-600" />
                <span>Pegar (Ctrl + V)</span>
              </button>
            </div>

            <div className="pt-1.5">
              <input
                type="url"
                value={createImageUrlInput}
                onChange={(e) => {
                  const clean = normalizeImageUrl(e.target.value);
                  setCreateImageUrlInput(clean);
                  if (createImageBase64) setCreateImageBase64(null);
                }}
                placeholder="O pegar enlace web o Google Drive de la foto..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            {(createImageBase64 || createImageUrlInput) && (
              <div className="flex items-center gap-3 pt-1">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-300 bg-white p-0.5 shadow-sm shrink-0">
                  <img
                    src={createImageBase64 || normalizeImageUrl(createImageUrlInput)}
                    alt="Preview categoría"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCreateImageBase64(null);
                    setCreateImageUrlInput('');
                  }}
                  className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                >
                  Quitar Foto
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Ej. Vestidos, Calzado, Camisas..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
            />
          </div>

          {/* Jerarquía de Categoría en Creación */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-slate-800 font-bold text-xs">
                Jerarquía y Nivel de Categoría
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Soporta hasta 3 niveles</span>
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="catHierarchyCreate"
                  checked={!createParentId}
                  onChange={() => setCreateParentId(null)}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-800">Categoría Principal (Nivel 1)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="catHierarchyCreate"
                  checked={!!createParentId}
                  onChange={() => {
                    const firstAvailable = categories.find((c) => !c.parent_id)?.id || null;
                    setCreateParentId(firstAvailable);
                  }}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-800">Subcategoría (Nivel 2 o 3)</span>
              </label>
            </div>

            {createParentId !== null && (
              <div className="pt-2 border-t border-slate-200/60 space-y-1">
                <label className="block text-slate-600 text-[11px] font-medium">
                  Pertenece a (Categoría Superior):
                </label>
                <select
                  value={createParentId || ''}
                  onChange={(e) => setCreateParentId(e.target.value || null)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  {categories.map((cat) => {
                    const depth = getCategoryDepth(cat, categories);
                    if (depth >= 3) return null;
                    const indent = depth === 1 ? '📁 ' : '↳ 📂 ';
                    return (
                      <option key={cat.id} value={cat.id}>
                        {indent}{cat.name} {depth === 2 ? '(Subcategoría Nivel 2)' : '(Categoría Principal)'}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              rows={3}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Descripción breve para guiar a tus clientes..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setCreateParentId(null);
                setIsCreatingCategory(false);
              }}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
            >
              Cancelar y Volver
            </button>
            <button
              type="submit"
              disabled={savingCreate || !createName.trim()}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              {savingCreate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Guardar Categoría</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // VISTA PÁGINA: EDITAR CATEGORÍA (CERO MODAL)
  if (editingCategory) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 text-slate-900 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              ← Volver a Categorías
            </button>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Editar Categoría: {editingCategory.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{editingCategory.slug}</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          {/* Foto Circular */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <label className="block text-slate-800 font-bold text-xs">
              Foto Representativa de la Categoría
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-pointer text-xs font-semibold shadow-xs">
                {compressingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" /> : <Upload className="w-3.5 h-3.5 text-slate-500" />}
                <span>{compressingImage ? 'Optimizando...' : 'Subir Foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        setCompressingImage(true);
                        const compressed = await compressImage(file, {
                          maxWidth: 600,
                          maxHeight: 600,
                          quality: 0.85,
                          outputFormat: 'image/webp',
                        });
                        setEditImageBase64(compressed);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setCompressingImage(false);
                      }
                    }
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={async () => {
                  try {
                    if (typeof navigator !== 'undefined' && navigator.clipboard?.read) {
                      const items = await navigator.clipboard.read();
                      for (const item of items) {
                        const imgType = item.types.find((t) => t.startsWith('image/'));
                        if (imgType) {
                          const blob = await item.getType(imgType);
                          const file = new File([blob], 'cat.png', { type: imgType });
                          const compressed = await compressImage(file, {
                            maxWidth: 600,
                            maxHeight: 600,
                            quality: 0.85,
                            outputFormat: 'image/webp',
                          });
                          setEditImageBase64(compressed);
                          return;
                        }
                      }
                    }
                    alert('Presiona Ctrl + V para pegar la foto directamente.');
                  } catch {
                    alert('Presiona Ctrl + V para pegar la foto directamente.');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-700 cursor-pointer text-xs font-semibold"
              >
                <Clipboard className="w-3.5 h-3.5 text-sky-600" />
                <span>Pegar (Ctrl + V)</span>
              </button>
            </div>

            <div className="pt-1.5">
              <input
                type="url"
                value={editImageUrlInput}
                onChange={(e) => {
                  const clean = normalizeImageUrl(e.target.value);
                  setEditImageUrlInput(clean);
                  if (editImageBase64) setEditImageBase64(null);
                }}
                placeholder="O pegar enlace web o Google Drive de la foto..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            {(editImageBase64 || editImageUrlInput || editCurrentImageUrl) && (
              <div className="flex items-center gap-3 pt-1">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-300 bg-white p-0.5 shadow-sm shrink-0">
                  <img
                    src={editImageBase64 || (editImageUrlInput ? normalizeImageUrl(editImageUrlInput) : editCurrentImageUrl!)}
                    alt="Preview categoría"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditImageBase64(null);
                    setEditImageUrlInput('');
                    setEditCurrentImageUrl(null);
                  }}
                  className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                >
                  Quitar Foto
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nombre de categoría..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
            />
          </div>

          {/* Jerarquía de Categoría en Edición */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-slate-800 font-bold text-xs">
                Jerarquía y Nivel de Categoría
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Soporta hasta 3 niveles</span>
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="catHierarchyEdit"
                  checked={!editParentId}
                  onChange={() => setEditParentId(null)}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-800">Categoría Principal (Nivel 1)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="catHierarchyEdit"
                  checked={!!editParentId}
                  onChange={() => {
                    const firstAvailable = categories.find((c) => c.id !== editingCategory?.id && !c.parent_id)?.id || null;
                    setEditParentId(firstAvailable);
                  }}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-800">Subcategoría (Nivel 2 o 3)</span>
              </label>
            </div>

            {editParentId !== null && (
              <div className="pt-2 border-t border-slate-200/60 space-y-1">
                <label className="block text-slate-600 text-[11px] font-medium">
                  Pertenece a (Categoría Superior):
                </label>
                <select
                  value={editParentId || ''}
                  onChange={(e) => setEditParentId(e.target.value || null)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  {categories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((cat) => {
                      const depth = getCategoryDepth(cat, categories);
                      if (depth >= 3) return null;
                      const indent = depth === 1 ? '📁 ' : '↳ 📂 ';
                      return (
                        <option key={cat.id} value={cat.id}>
                          {indent}{cat.name} {depth === 2 ? '(Subcategoría Nivel 2)' : '(Categoría Principal)'}
                        </option>
                      );
                    })}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Descripción para clientes y catálogo..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none resize-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="block font-semibold text-slate-800 text-xs">
                Visibilidad en Catálogo
              </span>
              <span className="text-[10px] text-slate-400 block">
                Las categorías inactivas no se muestran a los clientes.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditIsActive(!editIsActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                editIsActive ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  editIsActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              disabled={savingEdit}
              onClick={() => setEditingCategory(null)}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
            >
              Cancelar y Volver
            </button>
            <button
              type="submit"
              disabled={savingEdit || !editName.trim()}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              {savingEdit ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Cabecera con Métricas y Botón de Acción */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <Tag className="w-4 h-4" />
              </span>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                Gestión de Categorías
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Organiza las familias, líneas y colecciones para tu catálogo mayorista y storefront.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Refrescar lista de categorías"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500' : ''}`} />
            </button>

            <button
              onClick={() => {
                if (onOpenCreateModal) onOpenCreateModal();
                setIsCreatingCategory(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Categoría</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas de Categorías */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Total Categorías</div>
              <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                {categories.length}
              </div>
            </div>
            <Layers className="w-5 h-5 text-slate-400" />
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Categorías Activas</div>
              <div className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5">
                {totalActive}
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Artículos Vinculados</div>
              <div className="text-xl font-extrabold text-sky-600 font-mono mt-0.5">
                {totalProductsCount}
              </div>
            </div>
            <Boxes className="w-5 h-5 text-sky-500" />
          </div>
        </div>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Consola de Búsqueda y Filtros */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Input Búsqueda por Nombre, Slug o Descripción */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre de categoría, slug o descripción..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Selector de Filtro por Estado */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:border-slate-900 focus:outline-none transition-all shadow-xs cursor-pointer"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Solo Activas</option>
              <option value="inactive">Solo Inactivas</option>
            </select>
          </div>

          {/* Selector de Filtro por Artículos Vinculados */}
          <div className="sm:w-56">
            <select
              value={productsFilter}
              onChange={(e) => setProductsFilter(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:border-slate-900 focus:outline-none transition-all shadow-xs cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              <option value="with_products">Con productos vinculados</option>
              <option value="empty">Sin productos (vacías)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Contenido: Espera inicial de búsqueda vs Resultados */}
      {loading && categories.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl py-16 flex flex-col items-center justify-center space-y-2 text-slate-400 shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
          <span className="text-xs">Cargando categorías...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-xs">
            <Tag className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">Tu catálogo aún no tiene categorías</h4>
          <p className="max-w-xs mx-auto text-slate-500">
            Crea tu primera categoría para organizar las prendas y colecciones de tu tienda.
          </p>
          <button
            type="button"
            onClick={() => setIsCreatingCategory(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Primera Categoría</span>
          </button>
        </div>
      ) : !isFiltering ? (
        /* Estado Limpio: Esperando término de búsqueda o filtro */
        <div className="py-14 text-center text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-xs">
            <Search className="w-5 h-5 text-sky-500" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm">Búsqueda y Gestión de Categorías</h4>
            <p className="max-w-md mx-auto text-slate-500 text-[11px] leading-relaxed">
              Ingresa el nombre de una categoría o selecciona un filtro arriba para consultar y gestionar tus colecciones.
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAllCategories(true)}
              className="text-xs text-sky-600 hover:text-sky-800 font-semibold underline cursor-pointer"
            >
              O explorar todas las {categories.length} categorías
            </button>
          </div>
        </div>
      ) : displayedCategories.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <p className="font-semibold text-slate-700">No se encontraron categorías coincidentes</p>
          <p className="text-[11px]">Prueba con otro término de búsqueda o cambiando los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>
              Mostrando <strong>{displayedCategories.length}</strong> de {categories.length} categorías
            </span>
            {showAllCategories && (
              <button
                type="button"
                onClick={() => {
                  setShowAllCategories(false);
                  setSearchQuery('');
                  setStatusFilter('all');
                  setProductsFilter('all');
                }}
                className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
              >
                Limpiar y volver a la búsqueda
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Slug URL</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4 text-center">Productos</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedCategories.map((cat) => {
                  const prodCount = cat.products?.[0]?.count ?? 0;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nombre y Foto Circular con Jerarquía */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          {cat.parent_id && (
                            <CornerDownRight className="w-3.5 h-3.5 text-sky-500 shrink-0 ml-1" />
                          )}
                          {cat.image_url ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center p-0.5 shadow-xs">
                              <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                            </div>
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-bold text-xs shrink-0">
                              {cat.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate max-w-[200px]" title={cat.name}>
                                {cat.name}
                              </span>
                              {cat.parent_id ? (
                                <span className="text-[9px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 px-1.5 py-0.2 rounded-md">
                                  Subcategoría
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded-md">
                                  Principal
                                </span>
                              )}
                            </div>
                            {cat.parent_id && (
                              <span className="block text-[10px] text-slate-400 font-normal truncate">
                                de: {getCategoryParentName(cat, categories) || 'Categoría superior'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 truncate max-w-[160px] inline-block" title={cat.slug}>
                          {cat.slug}
                        </span>
                      </td>

                      {/* Descripción */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs truncate" title={cat.description || ''}>
                        {cat.description || <span className="text-slate-300 italic">Sin descripción</span>}
                      </td>

                      {/* Cantidad de Productos */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            prodCount > 0
                              ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Boxes className="w-3 h-3" />
                          <span>{prodCount}</span>
                        </span>
                      </td>

                      {/* Estado Activo / Inactivo */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                            cat.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title={cat.is_active ? 'Haz clic para desactivar' : 'Haz clic para activar'}
                        >
                          {cat.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Activa</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Inactiva</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                            title="Editar nombre y descripción de categoría"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingCat(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                            title="Eliminar categoría"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {/* =========================================================================
          MODAL: CONFIRMAR ELIMINACIÓN DE CATEGORÍA (ALERTA DE ADVERTENCIA)
          ========================================================================= */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            onClick={() => !deletingLoading && setDeletingCat(null)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-2xl z-10 space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-bold text-sm text-slate-900">¿Eliminar categoría?</h3>
                <p className="text-xs text-slate-500">
                  Vas a eliminar <strong className="text-slate-800">&quot;{deletingCat.name}&quot;</strong>.
                </p>
                {((deletingCat.products?.[0]?.count || 0) > 0) && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-xl mt-2">
                    ⚠️ Esta categoría tiene {deletingCat.products?.[0]?.count} productos asociados. Se desvincularán automáticamente sin ser eliminados.
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={deletingLoading}
                  onClick={() => setDeletingCat(null)}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={deletingLoading}
                  onClick={handleConfirmDelete}
                  className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {deletingLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Sí, Eliminar</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
