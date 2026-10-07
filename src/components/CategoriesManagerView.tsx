'use client';

import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Boxes,
  X,
  Check,
  RefreshCw,
  Layers,
  Upload,
  Clipboard,
  Info
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
}: CategoriesManagerViewProps) {
  const [categories, setCategories] = useState<ExtendedCategory[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados del Formulario (Añadir / Editar)
  const [editingCategory, setEditingCategory] = useState<ExtendedCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [formParentId, setFormParentId] = useState<string | null>(null);
  const [formDescription, setFormDescription] = useState('');
  const [formImageBase64, setFormImageBase64] = useState<string | null>(null);
  const [formImageUrlInput, setFormImageUrlInput] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [compressingImage, setCompressingImage] = useState(false);
  const [savingForm, setSavingForm] = useState(false);

  // Estado para confirmación de eliminación
  const [deletingCat, setDeletingCat] = useState<ExtendedCategory | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

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

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Helper para calcular profundidad jerárquica (1: principal, 2: subcategoría, 3: 3er nivel)
  const getCategoryDepth = (cat: Category, allCats: Category[]): number => {
    if (!cat.parent_id) return 1;
    const parent = allCats.find((c) => c.id === cat.parent_id);
    if (!parent) return 1;
    if (!parent.parent_id) return 2;
    return 3;
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

  // Cargar una categoría en el formulario para editarla
  const handleStartEdit = (cat: ExtendedCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setIsSlugManuallyEdited(true);
    setFormParentId(cat.parent_id || null);
    setFormDescription(cat.description || '');
    setFormImageBase64(null);
    setFormImageUrlInput(cat.image_url || '');
    setFormIsActive(cat.is_active ?? true);
    setErrorMsg(null);
    // Scroll suave hacia el formulario en pantallas móviles
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancelar edición y volver a modo creación
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setIsSlugManuallyEdited(false);
    setFormParentId(null);
    setFormDescription('');
    setFormImageBase64(null);
    setFormImageUrlInput('');
    setFormIsActive(true);
    setErrorMsg(null);
  };

  // Pre-seleccionar categoría superior y enfocar nombre para crear subcategoría
  const handleAddSubcategoryFromTable = (parentCat: ExtendedCategory) => {
    handleCancelEdit();
    setFormParentId(parentCat.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Guardar (Crear o Actualizar)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setSavingForm(true);
      setErrorMsg(null);

      const activeImageUrl = formImageUrlInput.trim()
        ? normalizeImageUrl(formImageUrlInput)
        : undefined;

      const cleanSlug = formSlug.trim() ? generateSlug(formSlug) : generateSlug(formName);

      if (editingCategory) {
        // MODO EDICIÓN (PATCH)
        const res = await fetch('/api/admin/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCategory.id,
            name: formName.trim(),
            slug: cleanSlug,
            description: formDescription.trim() || null,
            is_active: formIsActive,
            parent_id: formParentId || null,
            imageData: formImageBase64,
            image_url: !formImageBase64 ? activeImageUrl || null : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar categoría');

        setSuccessMsg(`Categoría "${formName.trim()}" actualizada exitosamente`);
        setTimeout(() => setSuccessMsg(null), 3000);

        const updated = categories.map((c) => (c.id === editingCategory.id ? data.category : c));
        setCategories(updated);
        onCategoriesChanged(updated);
        handleCancelEdit();
      } else {
        // MODO CREACIÓN (POST)
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            name: formName.trim(),
            slug: cleanSlug,
            description: formDescription.trim() || null,
            parent_id: formParentId || null,
            imageData: formImageBase64,
            image_url: !formImageBase64 ? activeImageUrl : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error creando categoría');

        setSuccessMsg(`Categoría "${formName.trim()}" añadida exitosamente`);
        setTimeout(() => setSuccessMsg(null), 3000);

        const updated = [...categories, data.category];
        setCategories(updated);
        onCategoriesChanged(updated);
        handleCancelEdit();
      }
    } catch (err: unknown) {
      const msg = translateErrorMessage(
        err,
        editingCategory ? 'No se pudo actualizar la categoría' : 'No se pudo crear la categoría'
      );
      setErrorMsg(msg);
    } finally {
      setSavingForm(false);
    }
  };

  // Alternar estado activo / inactivo directamente desde la tabla
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
      if (!res.ok) throw new Error(data.error || 'Error actualizando estado');

      const updated = categories.map((c) => (c.id === cat.id ? { ...c, is_active: newStatus } : c));
      setCategories(updated);
      onCategoriesChanged(updated);
      setSuccessMsg(`Categoría "${cat.name}" ${newStatus ? 'activada' : 'desactivada'}`);
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo cambiar el estado');
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

      if (editingCategory?.id === deletingCat.id) {
        handleCancelEdit();
      }
      setDeletingCat(null);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo eliminar la categoría');
      setErrorMsg(msg);
    } finally {
      setDeletingLoading(false);
    }
  };

  // Ordenamiento jerárquico recursivo (Árbol multinivel)
  const sortHierarchically = (cats: ExtendedCategory[]): ExtendedCategory[] => {
    const childrenMap = new Map<string, ExtendedCategory[]>();
    const roots: ExtendedCategory[] = [];

    cats.forEach((cat) => {
      if (!cat.parent_id) {
        roots.push(cat);
      } else {
        const list = childrenMap.get(cat.parent_id) || [];
        list.push(cat);
        childrenMap.set(cat.parent_id, list);
      }
    });

    const compareName = (a: ExtendedCategory, b: ExtendedCategory) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

    roots.sort(compareName);

    const result: ExtendedCategory[] = [];
    const addedIds = new Set<string>();

    const traverse = (item: ExtendedCategory) => {
      result.push(item);
      addedIds.add(item.id);
      const children = (childrenMap.get(item.id) || []).sort(compareName);
      children.forEach((child) => traverse(child));
    };

    roots.forEach((root) => traverse(root));

    cats.forEach((cat) => {
      if (!addedIds.has(cat.id)) {
        result.push(cat);
      }
    });

    return result;
  };

  // Filtrado de la tabla por buscador y selector de estado
  const filteredCategories = categories.filter((cat) => {
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

    return matchesSearch && matchesStatus;
  });

  const displayedCategories = sortHierarchically(filteredCategories);
  const totalActive = categories.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      {/* 1. Encabezado de Gestión de Categorías */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-2xs">
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Categorías del producto
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Las categorías de producto de tu tienda se gestionan desde aquí. Organiza tu catálogo en categorías principales y subcategorías jerárquicas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700">
            <span>Total:</span>
            <span className="font-extrabold font-mono text-slate-900">{categories.length}</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-extrabold">{totalActive} activas</span>
          </div>

          <button
            type="button"
            onClick={fetchCategories}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refrescar categorías"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alertas Globales de Error / Éxito */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-2xs">
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
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-200">
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
          2. LAYOUT DIVIDIDO EN 2 COLUMNAS (PANEL DE GESTIÓN INTEGRADO)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================================
            COLUMNA IZQUIERDA: FORMULARIO PERMANENTE (AÑADIR / EDITAR)
            ========================================================================= */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {editingCategory ? 'Editar categoría' : 'Añadir nueva categoría'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {editingCategory
                  ? `Modificando los datos de "${editingCategory.name}".`
                  : 'Completa los campos para crear una categoría o subcategoría.'}
              </p>
            </div>

            {editingCategory && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-sky-600 hover:text-sky-800 font-bold underline cursor-pointer"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            {/* Campo: Nombre */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormName(val);
                  if (!isSlugManuallyEdited) {
                    setFormSlug(generateSlug(val));
                  }
                }}
                placeholder="Ej. Vestidos, Calzado, Camisas..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all shadow-2xs font-medium"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                El nombre es como aparece en tu sitio y catálogo.
              </p>
            </div>

            {/* Campo: Slug */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Slug (URL amigable)
              </label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => {
                  setIsSlugManuallyEdited(true);
                  setFormSlug(generateSlug(e.target.value));
                }}
                placeholder="ej-vestidos-de-fiesta"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-700 focus:bg-white focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                El «slug» es la versión amigable de la URL para el nombre. Suele estar en minúsculas y contiene solo letras, números y guiones.
              </p>
            </div>

            {/* Campo: Categoría superior */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Categoría superior
              </label>
              <select
                value={formParentId || ''}
                onChange={(e) => setFormParentId(e.target.value || null)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none shadow-2xs cursor-pointer font-medium"
              >
                <option value="">Ninguna (Categoría Principal Nivel 1)</option>
                {categories
                  .filter((c) => !editingCategory || c.id !== editingCategory.id)
                  .map((cat) => {
                    const depth = getCategoryDepth(cat, categories);
                    if (depth >= 3) return null; // No permitir colgar de nivel 3 para no exceder 3 niveles
                    const prefix = depth === 1 ? '— ' : '—— ';
                    return (
                      <option key={cat.id} value={cat.id}>
                        {prefix}{cat.name} {depth === 2 ? '(Nivel 2)' : ''}
                      </option>
                    );
                  })}
              </select>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Asigna un término principal para crear jerarquías. Por ejemplo, «Ropa» sería el principal de «Pantalones» y este de «Jeans».
              </p>
            </div>

            {/* Campo: Descripción */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Descripción (Opcional)
              </label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descripción para clientes y catálogo..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none resize-none transition-all shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                La descripción ayuda a que tus clientes comprendan qué artículos encontrarán en esta colección.
              </p>
            </div>

            {/* Campo: Miniatura / Foto */}
            <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2">
              <label className="block text-slate-800 font-bold text-xs">
                Miniatura / Imagen Representativa
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-pointer text-xs font-semibold shadow-2xs transition-colors">
                  {compressingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" /> : <Upload className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{compressingImage ? 'Optimizando...' : 'Subir Imagen'}</span>
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
                          setFormImageBase64(compressed);
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
                            setFormImageBase64(compressed);
                            return;
                          }
                        }
                      }
                      alert('Presiona Ctrl + V para pegar la imagen directamente.');
                    } catch {
                      alert('Presiona Ctrl + V para pegar la imagen directamente.');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-700 cursor-pointer text-xs font-semibold transition-colors"
                >
                  <Clipboard className="w-3.5 h-3.5 text-sky-600" />
                  <span>Pegar (Ctrl + V)</span>
                </button>
              </div>

              <input
                type="url"
                value={formImageUrlInput}
                onChange={(e) => {
                  const clean = normalizeImageUrl(e.target.value);
                  setFormImageUrlInput(clean);
                  if (formImageBase64) setFormImageBase64(null);
                }}
                placeholder="O pegar enlace web o Google Drive de la foto..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
              />

              {(formImageBase64 || formImageUrlInput) && (
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-300 bg-white p-0.5 shadow-xs shrink-0">
                    <img
                      src={formImageBase64 || normalizeImageUrl(formImageUrlInput)}
                      alt="Miniatura preview"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormImageBase64(null);
                      setFormImageUrlInput('');
                    }}
                    className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                  >
                    Quitar miniatura
                  </button>
                </div>
              )}
            </div>

            {/* Switch de Estado al editar */}
            {editingCategory && (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Estado de la categoría</span>
                  <span className="text-[11px] text-slate-400 block">
                    {formIsActive ? 'Visible en el catálogo' : 'Oculta en la tienda'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    formIsActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  {formIsActive ? 'Activa' : 'Inactiva'}
                </button>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              )}

              <button
                type="submit"
                disabled={savingForm || !formName.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {savingForm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>{editingCategory ? 'Guardar Cambios' : 'Añadir nueva categoría'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* =========================================================================
            COLUMNA DERECHA: TABLA JERÁRQUICA (LISTA DE CATEGORÍAS)
            ========================================================================= */}
        <div className="lg:col-span-7 space-y-3">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar categorías por nombre o slug..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all shadow-2xs font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Todas las categorías</option>
              <option value="active">Solo activas</option>
              <option value="inactive">Solo inactivas</option>
            </select>
          </div>

          {/* Tabla Jerárquica */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">Imagen</th>
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-3">Descripción</th>
                    <th className="py-3 px-3 font-mono">Slug</th>
                    <th className="py-3 px-3 text-center">Cantidad</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading && categories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-sky-500 mb-1" />
                        <span>Cargando categorías...</span>
                      </td>
                    </tr>
                  ) : displayedCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Tag className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                        <p className="font-semibold text-slate-700">No se encontraron categorías</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {searchQuery ? 'Prueba con otro término de búsqueda.' : 'Crea tu primera categoría a la izquierda.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedCategories.map((cat) => {
                      const depth = getCategoryDepth(cat, categories);
                      const prodCount = cat.products?.[0]?.count ?? 0;
                      const isEditingThis = editingCategory?.id === cat.id;

                      // Prefijo de guiones jerárquicos multinivel
                      const prefix = depth === 1 ? '' : depth === 2 ? '— ' : '—— ';

                      return (
                        <tr
                          key={cat.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isEditingThis ? 'bg-sky-50/60 font-semibold' : ''
                          }`}
                        >
                          {/* Miniatura / Foto */}
                          <td className="py-3 px-3 text-center">
                            {cat.image_url ? (
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 mx-auto p-0.5 shadow-2xs">
                                <img
                                  src={cat.image_url}
                                  alt={cat.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              </div>
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-500 mx-auto flex items-center justify-center font-bold text-xs">
                                {cat.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </td>

                          {/* Nombre Jerárquico con guiones */}
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400 font-mono select-none">{prefix}</span>
                              <span className="text-slate-900 hover:text-sky-600 transition-colors cursor-pointer" onClick={() => handleStartEdit(cat)}>
                                {cat.name}
                              </span>

                              {/* Badges de nivel sutiles */}
                              {depth === 1 ? (
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded">
                                  Principal
                                </span>
                              ) : depth === 2 ? (
                                <span className="text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 px-1.5 py-0.2 rounded">
                                  Nivel 2
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-1.5 py-0.2 rounded">
                                  Nivel 3
                                </span>
                              )}

                              {/* Botón rápido para colgar subcategoría en el formulario de la izquierda */}
                              {depth < 3 && (
                                <button
                                  type="button"
                                  onClick={() => handleAddSubcategoryFromTable(cat)}
                                  className="text-[9px] text-sky-600 hover:text-sky-800 font-semibold bg-sky-50 hover:bg-sky-100 border border-sky-200/60 px-1.5 py-0.2 rounded transition-colors cursor-pointer"
                                  title={`Crear subcategoría dentro de ${cat.name}`}
                                >
                                  + Subcategoría
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Descripción */}
                          <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[150px] truncate" title={cat.description || ''}>
                            {cat.description || <span className="text-slate-300 italic">—</span>}
                          </td>

                          {/* Slug */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            <span className="truncate max-w-[120px] inline-block" title={cat.slug}>
                              {cat.slug}
                            </span>
                          </td>

                          {/* Cantidad de Productos */}
                          <td className="py-3 px-3 text-center">
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
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(cat)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                                cat.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                              }`}
                              title={cat.is_active ? 'Clic para desactivar' : 'Clic para activar'}
                            >
                              {cat.is_active ? 'Activa' : 'Inactiva'}
                            </button>
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(cat)}
                                className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                                title="Editar categoría en el panel izquierdo"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
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
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pie de tabla con información oficial */}
            <div className="bg-slate-50/80 border-t border-slate-200/80 p-3.5 flex items-start gap-2 text-slate-500 text-[11px]">
              <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Nota:</strong> Eliminar una categoría no borra las prendas asociadas a ella. Los productos conservarán su información y quedarán sin categoría para que puedas reasignarlos fácilmente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-slate-900">¿Eliminar categoría?</h4>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Vas a eliminar la categoría <strong>&ldquo;{deletingCat.name}&rdquo;</strong>. Sus prendas vinculadas quedarán sin categoría pero no se borrarán.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
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
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
