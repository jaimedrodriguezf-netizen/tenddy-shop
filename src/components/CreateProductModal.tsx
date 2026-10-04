'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  X,
  Package,
  Check,
  AlertCircle,
  Loader2,
  Upload,
  Clipboard,
  Image as ImageIcon
} from 'lucide-react';
import { Tenant, Category, Product } from '@/lib/types';
import { compressImage } from '@/lib/image-compressor';

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
  const [minOrderQty, setMinOrderQty] = useState(100);
  const [unitsPerPackage, setUnitsPerPackage] = useState(50);
  const [productImageBase64, setProductImageBase64] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [compressingImage, setCompressingImage] = useState(false);

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

  // Atributos dinámicos adaptados según industria o generales
  const [attr1, setAttr1] = useState(isPlastics ? '500 ml' : 'Caja x 24 unidades');
  const [attr2, setAttr2] = useState(isPlastics ? '28mm PCO 1881' : 'Estándar');
  const [attr3, setAttr3] = useState(isPlastics ? '24 gramos' : 'Bulto Termoencogible');
  const [attrMaterial, setAttrMaterial] = useState(isPlastics ? 'PET 100% Virgen' : 'Calidad Mayorista');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processImageFile = async (file: File) => {
    try {
      setCompressingImage(true);
      // Comprime fotos pesadas de smartphones (hasta 15MB) a ~200KB WebP de alta fidelidad
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

  // Escuchar pegado global cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return;

    const globalPasteListener = (e: ClipboardEvent) => {
      handlePaste(e);
    };

    window.addEventListener('paste', globalPasteListener);
    return () => {
      window.removeEventListener('paste', globalPasteListener);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) {
      setErrorMsg('El nombre y el SKU/Código son requeridos');
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
          presentacion: attr1,
          variante: attr2,
          empaque: attr3,
          material: attrMaterial,
        };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          category_id: categoryId || null,
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          description: description ? description.trim() : null,
          min_order_qty: Number(minOrderQty) || 1,
          units_per_package: Number(unitsPerPackage) || 1,
          attributes: { specs, badge: 'Nuevo' },
          imageData: productImageBase64,
          image_url: !productImageBase64 && imageUrlInput.trim() ? normalizeImageUrl(imageUrlInput) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear producto');
      }

      onProductCreated(data.product);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onPaste={handlePaste}
      className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 text-slate-900 shadow-xs space-y-5"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            ← Volver a Productos
          </button>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Agregar Nueva Prenda</h3>
            <p className="text-xs text-slate-500 mt-0.5">Ingresa la foto, datos técnicos y empaque para tus clientes mayoristas.</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Foto del Producto (Subir o Pegar) */}
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
                  <span>
                    {compressingImage
                      ? 'Optimizando foto...'
                      : productImageBase64
                      ? 'Cambiar Foto'
                      : 'Subir Foto'}
                  </span>
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
                  title="Pegar imagen del portapapeles"
                >
                  <Clipboard className="w-3.5 h-3.5 text-sky-600" />
                  <span>Pegar Foto (Ctrl + V)</span>
                </button>
              </div>

              {/* Opción de Enlace URL Directo / Google Drive */}
              <div className="pt-2 border-t border-slate-200/60">
                <label className="block text-[11px] text-slate-600 mb-1 font-medium">
                  O pegar enlace web / Google Drive de la foto:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => {
                      const clean = normalizeImageUrl(e.target.value);
                      setImageUrlInput(clean);
                      if (productImageBase64) setProductImageBase64(null);
                    }}
                    placeholder="https://images... o enlace de Google Drive"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                  {(productImageBase64 || imageUrlInput) && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductImageBase64(null);
                        setImageUrlInput('');
                      }}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
                      title="Retirar foto actual"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Sube la foto del producto o presiona <strong>Ctrl + V</strong>. La imagen se optimiza y comprime automáticamente para carga ultra-rápida.
              </p>

              {(productImageBase64 || imageUrlInput) && (
                <div className="relative mt-2 w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 bg-white p-1.5 shadow-sm group flex items-center justify-center">
                  <img
                    src={productImageBase64 || normalizeImageUrl(imageUrlInput)}
                    alt="Producto preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProductImageBase64(null);
                      setImageUrlInput('');
                    }}
                    className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer"
                    title="Quitar foto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                    Lista
                  </span>
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
                  placeholder={isPlastics ? 'Botella Cilíndrica 1 Litro' : 'Nombre de tu producto mayorista'}
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
                  placeholder="COD-001"
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
                <label className="block text-slate-700 mb-1 font-semibold">Uds por Bulto / Caja</label>
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

            {/* Atributos Específicos */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isPlastics ? 'Especificaciones de Fabricación' : 'Especificaciones y Presentación'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-600 text-[11px] font-medium">{isPlastics ? 'Capacidad (ml/oz)' : 'Presentación / Tamaño'}</label>
                  <input
                    type="text"
                    value={attr1}
                    onChange={(e) => setAttr1(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 text-[11px] font-medium">{isPlastics ? 'Boca / Rosca' : 'Variante / Color'}</label>
                  <input
                    type="text"
                    value={attr2}
                    onChange={(e) => setAttr2(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 text-[11px] font-medium">{isPlastics ? 'Gramaje Preforma' : 'Empaque / Despacho'}</label>
                  <input
                    type="text"
                    value={attr3}
                    onChange={(e) => setAttr3(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 text-[11px] font-medium">{isPlastics ? 'Material / Resina' : 'Material / Composición'}</label>
                  <input
                    type="text"
                    value={attrMaterial}
                    onChange={(e) => setAttrMaterial(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
              >
                Cancelar y Volver
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim() || !sku.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando y subiendo foto...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Guardar Producto</span>
                  </>
                )}
              </button>
            </div>
          </form>
    </div>
  );
}
