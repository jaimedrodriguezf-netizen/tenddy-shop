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
  Clipboard
} from 'lucide-react';
import { Category } from '@/lib/types';
import { compressImage } from '@/lib/image-compressor';

interface ExtendedCategory extends Category {
  products?: { count: number }[];
}

interface CategoriesManagerViewProps {
  tenantId: string;
  initialCategories: Category[];
  onCategoriesChanged: (categories: Category[]) => void;
  onOpenCreateModal: () => void;
}

export default function CategoriesManagerView({
  tenantId,
  initialCategories,
  onCategoriesChanged,
  onOpenCreateModal,
}: CategoriesManagerViewProps) {
  const [categories, setCategories] = useState<ExtendedCategory[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [compressingImage, setCompressingImage] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

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

  // Estados para crear categoría en página integrada
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createImageBase64, setCreateImageBase64] = useState<string | null>(null);
  const [createImageUrlInput, setCreateImageUrlInput] = useState('');
  const [savingCreate, setSavingCreate] = useState(false);

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
      setIsCreatingCategory(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creando categoría';
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
      const msg = err instanceof Error ? err.message : 'Error de conexión';
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
      const msg = err instanceof Error ? err.message : 'Error al guardar cambios';
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
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado';
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
      const msg = err instanceof Error ? err.message : 'Error al eliminar categoría';
      setErrorMsg(msg);
    } finally {
      setDeletingLoading(false);
    }
  };

  // Filtrado reactivo por buscador
  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cat.name?.toLowerCase().includes(q) ||
      cat.slug?.toLowerCase().includes(q) ||
      cat.description?.toLowerCase().includes(q)
    );
  });

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
              onClick={() => setIsCreatingCategory(false)}
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
              onClick={() => setIsCreatingCategory(false)}
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
              onClick={onOpenCreateModal}
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

      {/* 2. Barra de Búsqueda y Filtro */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de categoría, slug o descripción..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium shrink-0 self-center">
          {filteredCategories.length} de {categories.length} categorías
        </span>
      </div>

      {/* 3. Tabla / Lista de Categorías */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {loading && categories.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
            <span className="text-xs">Cargando categorías...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-3">
            <Tag className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No se encontraron categorías</p>
            <p className="text-[11px] text-slate-400">
              {searchQuery
                ? `No hay resultados para "${searchQuery}".`
                : 'Crea tu primera categoría para organizar los productos de tu catálogo.'}
            </p>
            {!searchQuery && (
              <button
                onClick={onOpenCreateModal}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Primera Categoría</span>
              </button>
            )}
          </div>
        ) : (
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
                {filteredCategories.map((cat) => {
                  const prodCount = cat.products?.[0]?.count ?? 0;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nombre y Foto Circular */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          {cat.image_url ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center p-0.5 shadow-xs">
                              <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                            </div>
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-bold text-xs shrink-0">
                              {cat.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="truncate max-w-[200px]" title={cat.name}>
                            {cat.name}
                          </span>
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
        )}
      </div>

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
