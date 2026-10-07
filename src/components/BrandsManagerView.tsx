'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
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
  Upload,
  Clipboard,
  Info
} from 'lucide-react';
import { Tenant, Brand, Product } from '@/lib/types';
import { compressImage } from '@/lib/image-compressor';
import { translateErrorMessage } from '@/lib/error-translator';

interface BrandsManagerViewProps {
  tenant: Tenant;
  products: Product[];
  initialBrands?: Brand[];
  onBrandsChanged?: (brands: Brand[]) => void;
}

export default function BrandsManagerView({
  tenant,
  products,
  initialBrands = [],
  onBrandsChanged,
}: BrandsManagerViewProps) {
  const [brands, setBrands] = useState<Brand[]>(
    initialBrands.length > 0 ? initialBrands : (tenant.settings?.brands || [])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados del Formulario (Añadir / Editar)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
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

  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirmación de eliminación
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Cargar marcas desde la API si no vienen por props
  useEffect(() => {
    async function loadBrands() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/brands?tenantId=${tenant.id}`);
        const data = await res.json();
        if (res.ok && data.brands) {
          setBrands(data.brands);
          onBrandsChanged?.(data.brands);
        }
      } catch (err) {
        console.error('Error cargando marcas:', err);
      } finally {
        setLoading(false);
      }
    }
    if (tenant.id) {
      loadBrands();
    }
  }, [tenant.id]);

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

  // Calcular conteo de prendas por marca
  const brandProductCountMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const brandVal = (p.attributes?.brand || '').toLowerCase().trim();
      if (brandVal) {
        map.set(brandVal, (map.get(brandVal) || 0) + 1);
      }
    });
    return map;
  }, [products]);

  // Helper de profundidad de marca
  const getBrandDepth = (b: Brand, allBrands: Brand[]): number => {
    if (!b.parent_id) return 1;
    const parent = allBrands.find((item) => item.id === b.parent_id);
    if (!parent) return 1;
    return 2;
  };

  // Cargar una marca en el formulario para editarla
  const handleStartEdit = (b: Brand) => {
    setEditingBrand(b);
    setFormName(b.name);
    setFormSlug(b.slug);
    setIsSlugManuallyEdited(true);
    setFormParentId(b.parent_id || null);
    setFormDescription(b.description || '');
    setFormImageBase64(null);
    setFormImageUrlInput(b.image_url || '');
    setFormIsActive(b.is_active !== false);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBrand(null);
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

  // Guardar (Crear o Actualizar Marca)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setSavingForm(true);
      setErrorMsg(null);

      const activeImageUrl = formImageUrlInput.trim() ? normalizeImageUrl(formImageUrlInput) : undefined;
      const cleanSlug = formSlug.trim() ? generateSlug(formSlug) : generateSlug(formName);

      if (editingBrand) {
        // ACTUALIZAR (PATCH)
        const res = await fetch('/api/admin/brands', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenant.id,
            id: editingBrand.id,
            name: formName.trim(),
            slug: cleanSlug,
            description: formDescription.trim() || undefined,
            parent_id: formParentId || null,
            is_active: formIsActive,
            imageData: formImageBase64,
            image_url: !formImageBase64 ? activeImageUrl || null : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar marca');

        const updated = brands.map((b) => (b.id === editingBrand.id ? data.brand : b));
        setBrands(updated);
        onBrandsChanged?.(updated);
        setSuccessMsg(`Marca "${formName.trim()}" actualizada exitosamente`);
        setTimeout(() => setSuccessMsg(null), 3000);
        handleCancelEdit();
      } else {
        // CREAR (POST)
        const res = await fetch('/api/admin/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenant.id,
            name: formName.trim(),
            slug: cleanSlug,
            description: formDescription.trim() || undefined,
            parent_id: formParentId || null,
            imageData: formImageBase64,
            image_url: !formImageBase64 ? activeImageUrl : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error creando marca');

        const updated = [...brands, data.brand];
        setBrands(updated);
        onBrandsChanged?.(updated);
        setSuccessMsg(`Marca "${formName.trim()}" añadida exitosamente`);
        setTimeout(() => setSuccessMsg(null), 3000);
        handleCancelEdit();
      }
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, editingBrand ? 'No se pudo actualizar la marca' : 'No se pudo crear la marca');
      setErrorMsg(msg);
    } finally {
      setSavingForm(false);
    }
  };

  // Eliminar Marca
  const handleConfirmDelete = async () => {
    if (!deletingBrand) return;

    try {
      setDeletingLoading(true);
      setErrorMsg(null);

      const res = await fetch(`/api/admin/brands?tenantId=${tenant.id}&brandId=${deletingBrand.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar marca');

      const updated = brands.filter((b) => b.id !== deletingBrand.id);
      setBrands(updated);
      onBrandsChanged?.(updated);

      if (editingBrand?.id === deletingBrand.id) {
        handleCancelEdit();
      }

      setSuccessMsg(`Marca "${deletingBrand.name}" eliminada`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setDeletingBrand(null);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo eliminar la marca');
      setErrorMsg(msg);
    } finally {
      setDeletingLoading(false);
    }
  };

  // Ordenamiento jerárquico recursivo
  const sortHierarchically = (list: Brand[]): Brand[] => {
    const childrenMap = new Map<string, Brand[]>();
    const roots: Brand[] = [];

    list.forEach((b) => {
      if (!b.parent_id) {
        roots.push(b);
      } else {
        const arr = childrenMap.get(b.parent_id) || [];
        arr.push(b);
        childrenMap.set(b.parent_id, arr);
      }
    });

    const compareName = (a: Brand, b: Brand) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

    roots.sort(compareName);

    const result: Brand[] = [];
    const addedIds = new Set<string>();

    const traverse = (item: Brand) => {
      result.push(item);
      addedIds.add(item.id);
      const children = (childrenMap.get(item.id) || []).sort(compareName);
      children.forEach((c) => traverse(c));
    };

    roots.forEach((root) => traverse(root));

    list.forEach((b) => {
      if (!addedIds.has(b.id)) {
        result.push(b);
      }
    });

    return result;
  };

  const filteredBrands = brands.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q) || (b.description && b.description.toLowerCase().includes(q));
  });

  const displayedBrands = sortHierarchically(filteredBrands);

  return (
    <div className="space-y-6">
      {/* 1. Encabezado */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
              <Award className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Marcas de productos
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Se pueden añadir marcas y se gestionan desde esta pantalla. Si quieres, puedes subir una imagen de marca para mostrarla en tu catálogo mayorista y filtros.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700">
            <span>Total:</span>
            <span className="font-extrabold font-mono text-slate-900">{brands.length} marcas</span>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                setLoading(true);
                const res = await fetch(`/api/admin/brands?tenantId=${tenant.id}`);
                const data = await res.json();
                if (res.ok && data.brands) setBrands(data.brands);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refrescar marcas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alertas */}
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
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-2xs">
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
          2. LAYOUT DIVIDIDO EN 2 COLUMNAS
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: FORMULARIO PERMANENTE (AÑADIR / EDITAR MARCA) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {editingBrand ? 'Editar marca' : 'Añadir marca nueva'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {editingBrand ? `Modificando datos de "${editingBrand.name}".` : 'Completa los campos para registrar una marca de confección.'}
              </p>
            </div>

            {editingBrand && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-sky-600 hover:text-sky-800 font-bold underline cursor-pointer"
              >
                Cancelar
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
                placeholder="Ej. Oxford, Denim Co, Tenddy..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all shadow-2xs font-medium"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                El nombre es como aparece en tu sitio y catálogo.
              </p>
            </div>

            {/* Campo: Slug */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Slug
              </label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => {
                  setIsSlugManuallyEdited(true);
                  setFormSlug(generateSlug(e.target.value));
                }}
                placeholder="ej-oxford-premium"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-700 focus:bg-white focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                El «slug» es la versión amigable de la URL para el nombre. Suele estar en minúsculas y contiene solo letras, números y guiones.
              </p>
            </div>

            {/* Campo: Marca principal */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Marca principal
              </label>
              <select
                value={formParentId || ''}
                onChange={(e) => setFormParentId(e.target.value || null)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none shadow-2xs cursor-pointer font-medium"
              >
                <option value="">Ninguna</option>
                {brands
                  .filter((b) => !editingBrand || b.id !== editingBrand.id)
                  .map((brandItem) => {
                    const depth = getBrandDepth(brandItem, brands);
                    const prefix = depth === 1 ? '' : '— ';
                    return (
                      <option key={brandItem.id} value={brandItem.id}>
                        {prefix}{brandItem.name}
                      </option>
                    );
                  })}
              </select>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Asigna un término principal para crear jerarquías. Por ejemplo, «Oxford» sería el principal de «Línea Ejecutiva».
              </p>
            </div>

            {/* Campo: Descripción */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Descripción
              </label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descripción de la marca o fabricante..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none resize-none transition-all shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                La descripción no se muestra por defecto; sin embargo, algunos temas del catálogo pueden mostrarla.
              </p>
            </div>

            {/* Campo: Miniatura / Imagen */}
            <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2">
              <label className="block text-slate-800 font-bold text-xs">
                Miniatura / Logo de la Marca
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
                            maxWidth: 500,
                            maxHeight: 500,
                            quality: 0.85,
                            outputFormat: 'image/webp',
                          });
                          setFormImageBase64(compressed);
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
                            const file = new File([blob], 'brand.png', { type: imgType });
                            const compressed = await compressImage(file, {
                              maxWidth: 500,
                              maxHeight: 500,
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-amber-800 cursor-pointer text-xs font-semibold transition-colors"
                >
                  <Clipboard className="w-3.5 h-3.5 text-amber-600" />
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
                placeholder="O pegar URL web de la imagen..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
              />

              {(formImageBase64 || formImageUrlInput) && (
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-300 bg-white p-0.5 shadow-xs shrink-0 flex items-center justify-center">
                    <img
                      src={formImageBase64 || normalizeImageUrl(formImageUrlInput)}
                      alt="Miniatura marca"
                      className="w-full h-full object-contain rounded-lg"
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

            {/* Botones de Acción */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              {editingBrand && (
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
                <span>{editingBrand ? 'Guardar Cambios' : 'Añadir marca nueva'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* COLUMNA DERECHA: TABLA DE MARCAS */}
        <div className="lg:col-span-7 space-y-3">
          {/* Barra de Búsqueda */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar marcas por nombre o slug..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all font-medium"
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
          </div>

          {/* Tabla de Marcas */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-3 text-center w-8">
                      <input
                        type="checkbox"
                        checked={displayedBrands.length > 0 && displayedBrands.every((b) => selectedIds.has(b.id))}
                        onChange={() => {
                          if (displayedBrands.every((b) => selectedIds.has(b.id))) {
                            setSelectedIds(new Set());
                          } else {
                            setSelectedIds(new Set(displayedBrands.map((b) => b.id)));
                          }
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3 text-center w-12">Imagen</th>
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-3">Descripción</th>
                    <th className="py-3 px-3 font-mono">Slug</th>
                    <th className="py-3 px-3 text-center">Cantidad</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading && brands.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-1" />
                        <span>Cargando marcas...</span>
                      </td>
                    </tr>
                  ) : displayedBrands.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Award className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                        <p className="font-semibold text-slate-700">No se ha encontrado ninguna marca</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {searchQuery ? 'Prueba con otro término de búsqueda.' : 'Crea tu primera marca a la izquierda.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedBrands.map((brandItem) => {
                      const depth = getBrandDepth(brandItem, brands);
                      const prefix = depth === 1 ? '' : '— ';
                      const prodCount = brandProductCountMap.get(brandItem.name.toLowerCase().trim()) || 0;
                      const isEditingThis = editingBrand?.id === brandItem.id;
                      const isChecked = selectedIds.has(brandItem.id);

                      return (
                        <tr
                          key={brandItem.id}
                          className={`hover:bg-slate-50/80 transition-colors ${isEditingThis ? 'bg-amber-50/60 font-semibold' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const next = new Set(selectedIds);
                                if (next.has(brandItem.id)) next.delete(brandItem.id);
                                else next.add(brandItem.id);
                                setSelectedIds(next);
                              }}
                              className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          {/* Imagen */}
                          <td className="py-3 px-3 text-center">
                            {brandItem.image_url ? (
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mx-auto p-0.5 shadow-2xs flex items-center justify-center">
                                <img
                                  src={brandItem.image_url}
                                  alt={brandItem.name}
                                  className="w-full h-full object-contain rounded"
                                />
                              </div>
                            ) : (
                              <span className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 mx-auto flex items-center justify-center font-bold text-xs">
                                {brandItem.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </td>

                          {/* Nombre con prefijo jerárquico */}
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400 font-mono select-none">{prefix}</span>
                              <span
                                className="text-slate-900 hover:text-amber-700 transition-colors cursor-pointer"
                                onClick={() => handleStartEdit(brandItem)}
                              >
                                {brandItem.name}
                              </span>
                            </div>
                          </td>

                          {/* Descripción */}
                          <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[150px] truncate" title={brandItem.description || ''}>
                            {brandItem.description || <span className="text-slate-300 italic">—</span>}
                          </td>

                          {/* Slug */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            <span className="truncate max-w-[120px] inline-block" title={brandItem.slug}>
                              {brandItem.slug}
                            </span>
                          </td>

                          {/* Cantidad de prendas */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                prodCount > 0
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              <Boxes className="w-3 h-3" />
                              <span>{prodCount}</span>
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(brandItem)}
                                className="p-1.5 text-slate-500 hover:text-amber-700 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                                title="Editar marca"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingBrand(brandItem)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                                title="Eliminar marca"
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

            {/* Pie de tabla con información */}
            <div className="bg-slate-50/80 border-t border-slate-200/80 p-3.5 flex items-start gap-2 text-slate-500 text-[11px]">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Nota:</strong> Eliminar una marca no borra las prendas asociadas a ella. Los productos conservarán su información de catálogo y quedarán sin marca asignada.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {deletingBrand && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-slate-900">¿Eliminar marca?</h4>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Vas a eliminar la marca <strong>&ldquo;{deletingBrand.name}&rdquo;</strong>. Sus prendas vinculadas quedarán sin marca pero no se borrarán.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingBrand(null)}
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
