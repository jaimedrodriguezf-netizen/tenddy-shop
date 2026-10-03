'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  AlertCircle,
  Loader2,
  Upload,
  Clipboard
} from 'lucide-react';
import { Category, Product } from '@/lib/types';
import { compressImage } from '@/lib/image-compressor';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  onProductUpdated: (updatedProduct: Product) => void;
}

function EditProductModalContent({
  onClose,
  product,
  categories,
  onProductUpdated,
}: {
  onClose: () => void;
  product: Product;
  categories: Category[];
  onProductUpdated: (updatedProduct: Product) => void;
}) {
  const [name, setName] = useState(product.name || '');
  const [sku, setSku] = useState(product.sku || '');
  const [categoryId, setCategoryId] = useState(product.category_id || categories[0]?.id || '');
  const [description, setDescription] = useState(product.description || '');
  const [minOrderQty, setMinOrderQty] = useState(product.min_order_qty || 1);
  const [unitsPerPackage, setUnitsPerPackage] = useState(product.units_per_package || 1);
  const [productImageBase64, setProductImageBase64] = useState<string | null>(null);
  const [currentImageUrl] = useState<string | null>(product.images?.[0] || null);

  const specs = product.attributes?.specs || {};
  const [attrColor, setAttrColor] = useState(specs.color || specs.variante || '');
  const [attrTallas, setAttrTallas] = useState(specs.tallas || specs.capacidad || '');
  const [attrSpecs, setAttrSpecs] = useState(specs.costuras_patronaje || specs.material || '');

  const [loading, setLoading] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processImageFile = async (file: File) => {
    try {
      setCompressingImage(true);
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        outputFormat: 'image/webp',
      });
      setProductImageBase64(compressed);
    } catch (err) {
      console.error('Error comprimiendo imagen:', err);
    } finally {
      setCompressingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent | ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) {
          processImageFile(blob);
          if (typeof e.preventDefault === 'function') {
            e.preventDefault();
          }
          break;
        }
      }
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], 'producto.png', { type: imageType });
            processImageFile(file);
            return;
          }
        }
        alert('No se detectó ninguna imagen en el portapapeles. Copia una imagen primero.');
      } else {
        alert('Presiona Ctrl + V en tu teclado para pegar la foto del producto.');
      }
    } catch {
      alert('Presiona Ctrl + V en tu teclado para pegar la foto directamente.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      setErrorMsg('El nombre y el SKU/Código son obligatorios');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const updatedSpecs: Record<string, string> = {
      ...(product.attributes?.specs || {}),
      color: attrColor.trim(),
      tallas: attrTallas.trim(),
      costuras_patronaje: attrSpecs.trim(),
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          category_id: categoryId || null,
          description: description ? description.trim() : null,
          min_order_qty: Number(minOrderQty) || 1,
          units_per_package: Number(unitsPerPackage) || 1,
          attributes: {
            ...(product.attributes || {}),
            specs: updatedSpecs,
          },
          imageData: productImageBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar producto');
      }

      onProductUpdated(data.product);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const previewSrc = productImageBase64 || currentImageUrl;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div
          onPaste={handlePaste}
          className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 text-slate-900 shadow-2xl z-10 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Editar Producto</h3>
              <p className="text-xs text-slate-500 mt-0.5">Modifica nombre, foto, tallas, color y especificaciones técnicas.</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Foto del Producto (Subir o Cambiar) */}
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <label className="block text-slate-800 font-bold text-xs">
                Foto del Producto
              </label>

              <div className="flex flex-wrap items-center gap-2.5">
                <label className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-pointer transition-colors text-xs font-semibold shadow-xs">
                  {compressingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{compressingImage ? 'Optimizando...' : 'Cambiar Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  disabled={compressingImage}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-700 cursor-pointer transition-colors text-xs font-semibold disabled:opacity-50"
                  title="Pegar nueva imagen del portapapeles"
                >
                  <Clipboard className="w-3.5 h-3.5 text-sky-600" />
                  <span>Pegar Foto (Ctrl + V)</span>
                </button>
              </div>

              {previewSrc && (
                <div className="relative mt-2 w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 bg-white p-1.5 shadow-sm group flex items-center justify-center">
                  <img src={previewSrc} alt="Preview" className="w-full h-full object-contain" />
                  {productImageBase64 && (
                    <span className="absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      Nueva Foto Lista
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Bermuda Axel"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">SKU / Código *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="682E3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono uppercase focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Pedido Mínimo (MOQ)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={minOrderQty}
                  onChange={(e) => setMinOrderQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Uds por Bulto / Fardo</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={unitsPerPackage}
                  onChange={(e) => setUnitsPerPackage(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Color / Tonos</label>
                <input
                  type="text"
                  value={attrColor}
                  onChange={(e) => setAttrColor(e.target.value)}
                  placeholder="Ej. Azul Cielo, Blanco, Negro"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Tallas Disponibles</label>
                <input
                  type="text"
                  value={attrTallas}
                  onChange={(e) => setAttrTallas(e.target.value)}
                  placeholder="Ej. S, M, L, XL o 28 a 36"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Descripción Comercial</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles sobre presentación, empaque o características clave..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Detalles Técnicos / Costuras / Moldes</label>
              <input
                type="text"
                value={attrSpecs}
                onChange={(e) => setAttrSpecs(e.target.value)}
                placeholder="Ej. Doble pespunte reforzado, pretina anatómica con elástico..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim() || !sku.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Actualizar Producto</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EditProductModal(props: EditProductModalProps) {
  if (!props.isOpen || !props.product) return null;
  return <EditProductModalContent {...props} product={props.product} key={props.product.id} />;
}
