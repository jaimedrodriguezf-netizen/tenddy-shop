'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  Check,
  RefreshCw,
  Info,
  Settings
} from 'lucide-react';
import { Tenant, ProductAttribute, Product } from '@/lib/types';
import { translateErrorMessage } from '@/lib/error-translator';

interface AttributesManagerViewProps {
  tenant: Tenant;
  products: Product[];
  initialAttributes?: ProductAttribute[];
  onAttributesChanged?: (attributes: ProductAttribute[]) => void;
}

export default function AttributesManagerView({
  tenant,
  initialAttributes = [],
  onAttributesChanged,
}: AttributesManagerViewProps) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>(
    initialAttributes.length > 0 ? initialAttributes : (tenant.settings?.attributes || [])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados del Formulario (Añadir / Editar)
  const [editingAttr, setEditingAttr] = useState<ProductAttribute | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [formEnableArchives, setFormEnableArchives] = useState(false);
  const [formOrderBy, setFormOrderBy] = useState('menu_order');
  const [formTermsInput, setFormTermsInput] = useState('');
  const [savingForm, setSavingForm] = useState(false);

  // Modal para configurar términos de un atributo
  const [configuringAttr, setConfiguringAttr] = useState<ProductAttribute | null>(null);
  const [newTermValue, setNewTermValue] = useState('');
  const [savingTerms, setSavingTerms] = useState(false);

  // Confirmación de eliminación
  const [deletingAttr, setDeletingAttr] = useState<ProductAttribute | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Cargar atributos desde la API
  useEffect(() => {
    async function loadAttributes() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/attributes?tenantId=${tenant.id}`);
        const data = await res.json();
        if (res.ok && data.attributes) {
          setAttributes(data.attributes);
          onAttributesChanged?.(data.attributes);
        }
      } catch (err) {
        console.error('Error cargando atributos:', err);
      } finally {
        setLoading(false);
      }
    }
    if (tenant.id) {
      loadAttributes();
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

  const handleStartEdit = (attr: ProductAttribute) => {
    setEditingAttr(attr);
    setFormName(attr.name);
    setFormSlug(attr.slug);
    setIsSlugManuallyEdited(true);
    setFormEnableArchives(Boolean(attr.enable_archives));
    setFormOrderBy(attr.order_by || 'menu_order');
    setFormTermsInput(attr.terms ? attr.terms.join(', ') : '');
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingAttr(null);
    setFormName('');
    setFormSlug('');
    setIsSlugManuallyEdited(false);
    setFormEnableArchives(false);
    setFormOrderBy('menu_order');
    setFormTermsInput('');
    setErrorMsg(null);
  };

  // Guardar (Crear o Editar Atributo)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setSavingForm(true);
      setErrorMsg(null);

      const cleanSlug = formSlug.trim() ? generateSlug(formSlug) : generateSlug(formName);
      const parsedTerms = formTermsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingAttr) {
        // ACTUALIZAR (PATCH)
        const res = await fetch('/api/admin/attributes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenant.id,
            id: editingAttr.id,
            name: formName.trim(),
            slug: cleanSlug,
            enable_archives: formEnableArchives,
            order_by: formOrderBy,
            terms: parsedTerms,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar atributo');

        const updated = attributes.map((a) => (a.id === editingAttr.id ? data.attribute : a));
        setAttributes(updated);
        onAttributesChanged?.(updated);
        setSuccessMsg(`Atributo "${formName.trim()}" actualizado exitosamente`);
        setTimeout(() => setSuccessMsg(null), 3000);
        handleCancelEdit();
      } else {
        // CREAR (POST)
        const res = await fetch('/api/admin/attributes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenant.id,
            name: formName.trim(),
            slug: cleanSlug,
            enable_archives: formEnableArchives,
            order_by: formOrderBy,
            terms: parsedTerms,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error creando atributo');

        const updated = [...attributes, data.attribute];
        setAttributes(updated);
        onAttributesChanged?.(updated);
        setSuccessMsg(`Atributo "${formName.trim()}" añadido exitosamente`);
        setTimeout(() => setSuccessMsg(null), 3000);
        handleCancelEdit();
      }
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, editingAttr ? 'No se pudo actualizar el atributo' : 'No se pudo crear el atributo');
      setErrorMsg(msg);
    } finally {
      setSavingForm(false);
    }
  };

  // Configurar y añadir término rápido
  const handleAddTerm = async () => {
    if (!configuringAttr || !newTermValue.trim() || savingTerms) return;

    try {
      setSavingTerms(true);
      const val = newTermValue.trim();
      const currentTerms = configuringAttr.terms || [];
      if (currentTerms.includes(val)) {
        setNewTermValue('');
        return;
      }

      const updatedTerms = [...currentTerms, val];

      const res = await fetch('/api/admin/attributes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          id: configuringAttr.id,
          terms: updatedTerms,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar término');

      const updated = attributes.map((a) => (a.id === configuringAttr.id ? data.attribute : a));
      setAttributes(updated);
      setConfiguringAttr(data.attribute);
      onAttributesChanged?.(updated);
      setNewTermValue('');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTerms(false);
    }
  };

  // Quitar un término
  const handleRemoveTerm = async (termToRemove: string) => {
    if (!configuringAttr || savingTerms) return;

    try {
      setSavingTerms(true);
      const updatedTerms = (configuringAttr.terms || []).filter((t) => t !== termToRemove);

      const res = await fetch('/api/admin/attributes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          id: configuringAttr.id,
          terms: updatedTerms,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar término');

      const updated = attributes.map((a) => (a.id === configuringAttr.id ? data.attribute : a));
      setAttributes(updated);
      setConfiguringAttr(data.attribute);
      onAttributesChanged?.(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTerms(false);
    }
  };

  // Eliminar Atributo
  const handleConfirmDelete = async () => {
    if (!deletingAttr) return;

    try {
      setDeletingLoading(true);
      setErrorMsg(null);

      const res = await fetch(`/api/admin/attributes?tenantId=${tenant.id}&attributeId=${deletingAttr.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar atributo');

      const updated = attributes.filter((a) => a.id !== deletingAttr.id);
      setAttributes(updated);
      onAttributesChanged?.(updated);

      if (editingAttr?.id === deletingAttr.id) {
        handleCancelEdit();
      }

      setSuccessMsg(`Atributo "${deletingAttr.name}" eliminado`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setDeletingAttr(null);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo eliminar el atributo');
      setErrorMsg(msg);
    } finally {
      setDeletingLoading(false);
    }
  };

  const getOrderLabel = (orderKey?: string) => {
    switch (orderKey) {
      case 'name':
        return 'Nombre';
      case 'name_num':
        return 'Nombre (numérico)';
      case 'id':
        return 'ID del término';
      default:
        return 'Orden personalizado';
    }
  };

  const displayedAttributes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return attributes;
    return attributes.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        (a.terms && a.terms.some((t) => t.toLowerCase().includes(q)))
    );
  }, [attributes, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Encabezado */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Atributos
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Los atributos te permiten definir datos adicionales del producto, como talla o color. Puedes usar atributos para variantes y filtros de tu catálogo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700">
            <span>Total:</span>
            <span className="font-extrabold font-mono text-slate-900">{attributes.length} atributos</span>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                setLoading(true);
                const res = await fetch(`/api/admin/attributes?tenantId=${tenant.id}`);
                const data = await res.json();
                if (res.ok && data.attributes) setAttributes(data.attributes);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refrescar atributos"
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
        {/* COLUMNA IZQUIERDA: FORMULARIO PERMANENTE (AÑADIR / EDITAR ATRIBUTO) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {editingAttr ? 'Editar atributo' : 'Añadir un nuevo atributo'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {editingAttr ? `Modificando datos de "${editingAttr.name}".` : 'Define los atributos para tallas, colores o materiales de tus productos.'}
              </p>
            </div>

            {editingAttr && (
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
                placeholder="Ej. Talla, Color, Material..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all shadow-2xs font-medium"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nombre para el atributo (mostrado en la tienda).
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
                placeholder="ej-talla"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-700 focus:bg-white focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Slug o referencia única para el atributo.
              </p>
            </div>

            {/* Campo: ¿Activar archivos? */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formEnableArchives}
                  onChange={(e) => setFormEnableArchives(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 block text-xs">¿Activar archivos?</span>
                  <span className="text-[11px] text-slate-400 leading-relaxed block">
                    Activa esto si quieres que este atributo tenga páginas de archivo de producto en tu tienda.
                  </span>
                </div>
              </label>
            </div>

            {/* Campo: Orden de clasificación por defecto */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Orden de clasificación por defecto
              </label>
              <select
                value={formOrderBy}
                onChange={(e) => setFormOrderBy(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none shadow-2xs cursor-pointer font-medium"
              >
                <option value="menu_order">Orden personalizado</option>
                <option value="name">Nombre</option>
                <option value="name_num">Nombre (numérico)</option>
                <option value="id">ID del término</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Determina el orden de los términos en las páginas de productos de la tienda. Si usas un orden personalizado puedes arrastrar y soltar los términos en este atributo.
              </p>
            </div>

            {/* Campo: Términos iniciales */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Términos / Valores (Separar con comas)
              </label>
              <input
                type="text"
                value={formTermsInput}
                onChange={(e) => setFormTermsInput(e.target.value)}
                placeholder="Ej. S, M, L, XL ó Negro, Blanco, Azul..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none transition-all shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Valores predefinidos de este atributo para seleccionar en tus prendas.
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              {editingAttr && (
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
                <span>{editingAttr ? 'Guardar Cambios' : 'Añadir atributo'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* COLUMNA DERECHA: TABLA DE ATRIBUTOS */}
        <div className="lg:col-span-7 space-y-3">
          {/* Barra de Búsqueda */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar atributos..."
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

          {/* Tabla de Atributos */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-3 font-mono">Slug</th>
                    <th className="py-3 px-3">Ordenar por</th>
                    <th className="py-3 px-4">Términos</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading && attributes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-500 mb-1" />
                        <span>Cargando atributos...</span>
                      </td>
                    </tr>
                  ) : displayedAttributes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <SlidersHorizontal className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                        <p className="font-semibold text-slate-700">Actualmente no existen atributos.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {searchQuery ? 'Prueba con otro término de búsqueda.' : 'Añade un nuevo atributo a la izquierda.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedAttributes.map((attr) => {
                      const isEditingThis = editingAttr?.id === attr.id;
                      const termsList = attr.terms || [];

                      return (
                        <tr
                          key={attr.id}
                          className={`hover:bg-slate-50/80 transition-colors ${isEditingThis ? 'bg-indigo-50/60 font-semibold' : ''}`}
                        >
                          {/* Nombre */}
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>
                              <span
                                className="text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer block"
                                onClick={() => handleStartEdit(attr)}
                              >
                                {attr.name}
                              </span>
                              {attr.enable_archives && (
                                <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-normal inline-block mt-0.5">
                                  Archivos activos
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Slug */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            <span className="truncate max-w-[120px] inline-block" title={attr.slug}>
                              {attr.slug}
                            </span>
                          </td>

                          {/* Ordenar por */}
                          <td className="py-3 px-3 text-slate-600 text-[11px]">
                            {getOrderLabel(attr.order_by)}
                          </td>

                          {/* Términos */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1">
                              {termsList.length === 0 ? (
                                <span className="text-slate-400 italic text-[11px]">Sin términos</span>
                              ) : (
                                termsList.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium border border-slate-200/80"
                                  >
                                    {t}
                                  </span>
                                ))
                              )}

                              <button
                                type="button"
                                onClick={() => setConfiguringAttr(attr)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline ml-1 cursor-pointer"
                              >
                                Configurar términos
                              </button>
                            </div>
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(attr)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                                title="Editar atributo"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingAttr(attr)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                                title="Eliminar atributo"
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
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Nota:</strong> Los atributos definen las opciones disponibles para tus productos. Configura los términos para que aparezcan en los selectores y cotizadores de tu tienda.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Configurar Términos de un Atributo */}
      {configuringAttr && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Configurar términos de &ldquo;{configuringAttr.name}&rdquo;
                  </h4>
                  <p className="text-[11px] text-slate-500">Añade o elimina los valores posibles de este atributo.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfiguringAttr(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lista actual de términos */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold text-xs">Términos actuales:</label>
              <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[50px] max-h-48 overflow-y-auto">
                {(configuringAttr.terms || []).length === 0 ? (
                  <span className="text-slate-400 italic text-xs">No hay términos añadidos.</span>
                ) : (
                  (configuringAttr.terms || []).map((term, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      <span>{term}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTerm(term)}
                        disabled={savingTerms}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Eliminar término"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Añadir nuevo término */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold text-xs">Añadir nuevo término:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTermValue}
                  onChange={(e) => setNewTermValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTerm();
                    }
                  }}
                  placeholder="Ej. XXL, Rojo Pasión, 100% Algodón..."
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddTerm}
                  disabled={!newTermValue.trim() || savingTerms}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  {savingTerms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Añadir'}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfiguringAttr(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deletingAttr && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-slate-900">¿Eliminar atributo?</h4>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Vas a eliminar el atributo <strong>&ldquo;{deletingAttr.name}&rdquo;</strong>. Sus términos ya no estarán disponibles para asignar a nuevos productos.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingAttr(null)}
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
