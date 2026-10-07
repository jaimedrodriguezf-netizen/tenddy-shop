'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Info
} from 'lucide-react';
import { Tenant, ProductTag, Product } from '@/lib/types';
import { translateErrorMessage } from '@/lib/error-translator';

interface TagsManagerViewProps {
  tenant: Tenant;
  products: Product[];
  initialTags?: ProductTag[];
  onTagsChanged?: (tags: ProductTag[]) => void;
}

export default function TagsManagerView({
  tenant,
  products,
  initialTags = [],
  onTagsChanged,
}: TagsManagerViewProps) {
  const [tags, setTags] = useState<ProductTag[]>(
    initialTags.length > 0 ? initialTags : (tenant.settings?.tags || [])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados del Formulario (Añadir / Editar)
  const [editingTag, setEditingTag] = useState<ProductTag | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [formDescription, setFormDescription] = useState('');
  const [savingForm, setSavingForm] = useState(false);

  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirmación de eliminación
  const [deletingTag, setDeletingTag] = useState<ProductTag | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Cargar etiquetas desde la API
  useEffect(() => {
    async function loadTags() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/tags?tenantId=${tenant.id}`);
        const data = await res.json();
        if (res.ok && data.tags) {
          setTags(data.tags);
          onTagsChanged?.(data.tags);
        }
      } catch (err) {
        console.error('Error cargando etiquetas:', err);
      } finally {
        setLoading(false);
      }
    }
    if (tenant.id) {
      loadTags();
    }
  }, [tenant.id]);

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Conteo de prendas que tienen asignada cada etiqueta
  const tagProductCountMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const pTags = Array.isArray(p.attributes?.tags) ? p.attributes.tags : [];
      pTags.forEach((t) => {
        const clean = t.toLowerCase().trim();
        if (clean) map.set(clean, (map.get(clean) || 0) + 1);
      });
      if (p.attributes?.badge) {
        const badgeClean = p.attributes.badge.toLowerCase().trim();
        map.set(badgeClean, (map.get(badgeClean) || 0) + 1);
      }
    });
    return map;
  }, [products]);

  // Iniciar edición de una etiqueta
  const handleStartEdit = (t: ProductTag) => {
    setEditingTag(t);
    setFormName(t.name);
    setFormSlug(t.slug);
    setIsSlugManuallyEdited(true);
    setFormDescription(t.description || '');
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setFormName('');
    setFormSlug('');
    setIsSlugManuallyEdited(false);
    setFormDescription('');
    setErrorMsg(null);
  };

  // Guardar (Crear o Editar Etiqueta)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setSavingForm(true);
      setErrorMsg(null);

      const cleanSlug = formSlug.trim() ? generateSlug(formSlug) : generateSlug(formName);

      if (editingTag) {
        // ACTUALIZAR (PATCH)
        const res = await fetch('/api/admin/tags', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenant.id,
            id: editingTag.id,
            name: formName.trim(),
            slug: cleanSlug,
            description: formDescription.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar etiqueta');

        const updated = tags.map((t) => (t.id === editingTag.id ? data.tag : t));
        setTags(updated);
        onTagsChanged?.(updated);
        setSuccessMsg(`Etiqueta "${formName.trim()}" actualizada exitosamente`);
        setTimeout(() => setSuccessMsg(null), 3000);
        handleCancelEdit();
      } else {
        // CREAR (POST)
        const res = await fetch('/api/admin/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenant.id,
            name: formName.trim(),
            slug: cleanSlug,
            description: formDescription.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error creando etiqueta');

        const updated = [...tags, data.tag];
        setTags(updated);
        onTagsChanged?.(updated);
        setSuccessMsg(`Etiqueta "${formName.trim()}" añadida exitosamente`);
        setTimeout(() => setSuccessMsg(null), 3000);
        handleCancelEdit();
      }
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, editingTag ? 'No se pudo actualizar la etiqueta' : 'No se pudo crear la etiqueta');
      setErrorMsg(msg);
    } finally {
      setSavingForm(false);
    }
  };

  // Eliminar Etiqueta
  const handleConfirmDelete = async () => {
    if (!deletingTag) return;

    try {
      setDeletingLoading(true);
      setErrorMsg(null);

      const res = await fetch(`/api/admin/tags?tenantId=${tenant.id}&tagId=${deletingTag.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar etiqueta');

      const updated = tags.filter((t) => t.id !== deletingTag.id);
      setTags(updated);
      onTagsChanged?.(updated);

      if (editingTag?.id === deletingTag.id) {
        handleCancelEdit();
      }

      setSuccessMsg(`Etiqueta "${deletingTag.name}" eliminada`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setDeletingTag(null);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo eliminar la etiqueta');
      setErrorMsg(msg);
    } finally {
      setDeletingLoading(false);
    }
  };

  // Filtrado y ordenamiento alfabético ascendente
  const displayedTags = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tags
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [tags, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Encabezado Oficial */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-2xs">
              <Tag className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Etiquetas del producto
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Las etiquetas son descriptores clave para agrupar prendas por ocasiones, estilos o temporadas en tu catálogo mayorista.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700">
            <span>Total:</span>
            <span className="font-extrabold font-mono text-slate-900">{tags.length} etiquetas</span>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                setLoading(true);
                const res = await fetch(`/api/admin/tags?tenantId=${tenant.id}`);
                const data = await res.json();
                if (res.ok && data.tags) setTags(data.tags);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refrescar etiquetas"
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
        {/* COLUMNA IZQUIERDA: FORMULARIO PERMANENTE (AÑADIR / EDITAR ETIQUETA) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {editingTag ? 'Editar etiqueta' : 'Añadir nueva etiqueta'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {editingTag ? `Modificando datos de "${editingTag.name}".` : 'Completa los campos para crear una etiqueta descriptiva.'}
              </p>
            </div>

            {editingTag && (
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
                placeholder="Ej. Novedad, Oferta, Verano, Algodón..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all shadow-2xs font-medium"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                El nombre es como aparece en tu sitio.
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
                placeholder="ej-novedades-verano"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-700 focus:bg-white focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                El «slug» es la versión amigable de la URL para el nombre. Suele estar en todo en minúsculas y contiene solo letras, números y guiones.
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
                placeholder="Descripción breve de la etiqueta..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none resize-none transition-all shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                La descripción no se muestra por defecto; sin embargo, algunos temas del catálogo pueden mostrarla.
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              {editingTag && (
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
                <span>{editingTag ? 'Guardar Cambios' : 'Añadir nueva etiqueta'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* COLUMNA DERECHA: TABLA DE ETIQUETAS */}
        <div className="lg:col-span-7 space-y-3">
          {/* Barra de Búsqueda */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar etiquetas por nombre o slug..."
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

          {/* Tabla de Etiquetas */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-3 text-center w-8">
                      <input
                        type="checkbox"
                        checked={displayedTags.length > 0 && displayedTags.every((t) => selectedIds.has(t.id))}
                        onChange={() => {
                          if (displayedTags.every((t) => selectedIds.has(t.id))) {
                            setSelectedIds(new Set());
                          } else {
                            setSelectedIds(new Set(displayedTags.map((t) => t.id)));
                          }
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-3">Descripción</th>
                    <th className="py-3 px-3 font-mono">Slug</th>
                    <th className="py-3 px-3 text-center">Cantidad</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading && tags.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-sky-500 mb-1" />
                        <span>Cargando etiquetas...</span>
                      </td>
                    </tr>
                  ) : displayedTags.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Tag className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                        <p className="font-semibold text-slate-700">No se han encontrado etiquetas</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {searchQuery ? 'Prueba con otro término de búsqueda.' : 'Crea tu primera etiqueta a la izquierda.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedTags.map((tagItem) => {
                      const prodCount = tagProductCountMap.get(tagItem.name.toLowerCase().trim()) || 0;
                      const isEditingThis = editingTag?.id === tagItem.id;
                      const isChecked = selectedIds.has(tagItem.id);

                      return (
                        <tr
                          key={tagItem.id}
                          className={`hover:bg-slate-50/80 transition-colors ${isEditingThis ? 'bg-sky-50/60 font-semibold' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const next = new Set(selectedIds);
                                if (next.has(tagItem.id)) next.delete(tagItem.id);
                                else next.add(tagItem.id);
                                setSelectedIds(next);
                              }}
                              className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          {/* Nombre */}
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="text-slate-900 hover:text-sky-600 transition-colors cursor-pointer"
                                onClick={() => handleStartEdit(tagItem)}
                              >
                                {tagItem.name}
                              </span>
                            </div>
                          </td>

                          {/* Descripción */}
                          <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[180px] truncate" title={tagItem.description || ''}>
                            {tagItem.description || <span className="text-slate-300 italic">—</span>}
                          </td>

                          {/* Slug */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            <span className="truncate max-w-[120px] inline-block" title={tagItem.slug}>
                              {tagItem.slug}
                            </span>
                          </td>

                          {/* Cantidad de prendas */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                prodCount > 0
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
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
                                onClick={() => handleStartEdit(tagItem)}
                                className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                                title="Editar etiqueta"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingTag(tagItem)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                                title="Eliminar etiqueta"
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
              <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Nota:</strong> Eliminar una etiqueta no borra las prendas asociadas a ella. Los productos conservarán su información de catálogo y quedarán sin esa etiqueta.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {deletingTag && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-slate-900">¿Eliminar etiqueta?</h4>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Vas a eliminar la etiqueta <strong>&ldquo;{deletingTag.name}&rdquo;</strong>. Sus prendas vinculadas conservarán su información pero quedarán sin esta etiqueta.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingTag(null)}
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
