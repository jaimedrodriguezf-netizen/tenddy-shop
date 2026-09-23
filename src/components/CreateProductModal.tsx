'use client';

import React, { useState } from 'react';
import { Plus, X, Package, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Tenant, Category, Product } from '@/lib/types';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  categories: Category[];
  onProductCreated: (newProduct: Product) => void;
}

export default function CreateProductModal({
  isOpen,
  onClose,
  tenant,
  categories,
  onProductCreated,
}: CreateProductModalProps) {
  const isPlastics = tenant.industry_type === 'plastics';

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [minOrderQty, setMinOrderQty] = useState(500);
  const [unitsPerPackage, setUnitsPerPackage] = useState(100);

  // Atributos dinámicos
  const [attr1, setAttr1] = useState(isPlastics ? '500 ml' : 'Chocolate de Leche');
  const [attr2, setAttr2] = useState(isPlastics ? '28mm PCO 1881' : '18 Meses');
  const [attr3, setAttr3] = useState(isPlastics ? '24 gramos' : 'Bolsa x 12 uds');
  const [attrMaterial, setAttrMaterial] = useState(isPlastics ? 'PET 100% Virgen' : 'Fino de Aroma 42%');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) {
      setErrorMsg('Nombre y SKU son requeridos');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const specs: Record<string, string> = isPlastics
      ? {
          capacidad: attr1,
          boca: attr2,
          gramaje: attr3,
          material: attrMaterial,
        }
      : {
          sabor: attr1,
          vida_util: attr2,
          presentacion: attr3,
          tipo: attrMaterial,
        };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          category_id: categoryId || null,
          name,
          sku,
          description,
          min_order_qty: minOrderQty,
          units_per_package: unitsPerPackage,
          attributes: { specs, badge: 'Nuevo' },
          images: [isPlastics ? '/assets/products/ayme-001.svg' : '/assets/products/ayme-006.svg'],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear producto');
      }

      onProductCreated(data.product);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl z-10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-base text-white">Nuevo Producto / Envase B2B</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-2.5 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1 font-semibold">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isPlastics ? 'Botella Cilíndrica 1 Litro' : 'Caja Bombones Surtidos'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">SKU / Código *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="PET-1000-CIL"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white focus:border-sky-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Pedido Mínimo (MOQ)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={minOrderQty}
                  onChange={(e) => setMinOrderQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Uds por Bulto / Fardo</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={unitsPerPackage}
                  onChange={(e) => setUnitsPerPackage(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Descripción Técnica</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalle de resina, aplicaciones recomendadas, etc."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-sky-500 focus:outline-none resize-none"
              />
            </div>

            {/* Atributos Específicos */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block">
                {isPlastics ? 'Especificaciones de Moldeo' : 'Especificaciones de Alimento'}
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-[10px]">{isPlastics ? 'Capacidad (ml/oz)' : 'Sabor / Variedad'}</label>
                  <input
                    type="text"
                    value={attr1}
                    onChange={(e) => setAttr1(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">{isPlastics ? 'Boca / Rosca' : 'Vida Útil'}</label>
                  <input
                    type="text"
                    value={attr2}
                    onChange={(e) => setAttr2(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">{isPlastics ? 'Gramaje Preforma' : 'Presentación'}</label>
                  <input
                    type="text"
                    value={attr3}
                    onChange={(e) => setAttr3(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">{isPlastics ? 'Material / Resina' : 'Registro / Tipo'}</label>
                  <input
                    type="text"
                    value={attrMaterial}
                    onChange={(e) => setAttrMaterial(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-white font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Guardar Producto</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
