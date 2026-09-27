'use client';

import React, { useState } from 'react';
import {
  X,
  Package,
  ShieldCheck,
  CheckCircle2,
  Layers,
  MessageCircle,
  Plus,
  Minus,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import { Product, Tenant, Branch } from '@/lib/types';
import { useCartStore } from '@/lib/store/cart';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  tenant: Tenant;
  selectedBranch: Branch;
}

export default function ProductDetailModal(props: ProductDetailModalProps) {
  if (!props.product) return null;
  return <ProductModalContent {...props} product={props.product} />;
}

interface ProductModalContentProps {
  product: Product;
  onClose: () => void;
  tenant: Tenant;
  selectedBranch: Branch | null;
}

function ProductModalContent({
  product,
  onClose,
  tenant,
  selectedBranch,
}: ProductModalContentProps) {
  const { addItem } = useCartStore();

  const specs = product.attributes?.specs || {};
  const features: string[] = product.attributes?.features || [];
  const badge = product.attributes?.badge;
  const packSize = product.units_per_package || 100;
  const minQty = product.min_order_qty || packSize;
  const minPacks = Math.ceil(minQty / packSize);

  const [packageCount, setPackageCount] = useState<number>(minPacks);
  const [selectedColor, setSelectedColor] = useState<string>('Cristal Transparente');
  const [addedAlert, setAddedAlert] = useState(false);

  const targetWhatsapp = selectedBranch?.phone_whatsapp || tenant.landing_config.whatsapp_default;
  const totalUnits = packageCount * packSize;

  const handleAddToCart = () => {
    addItem(product, packageCount, selectedColor);
    setAddedAlert(true);
    setTimeout(() => setAddedAlert(false), 2500);
  };

  const handleDirectWhatsAppQuote = () => {
    let msg = `*CONSULTA TÉCNICA Y COTIZACIÓN*\n`;
    msg += `Envase: *${product.name}* (SKU: ${product.sku})\n`;
    msg += `Cantidad requerida: *${totalUnits.toLocaleString()} unidades* (${packageCount} fardos)\n`;
    msg += `Color/Acabado: ${selectedColor}\n`;
    if (selectedBranch) {
      msg += `Sucursal de interés: ${selectedBranch.name} (${selectedBranch.city})\n`;
    }
    const url = `https://wa.me/${targetWhatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop con desenfoque */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-8 z-10">
          {/* Header del Modal */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                SKU: {product.sku}
              </span>
              {badge && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                  {badge}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna Izquierda: Visualización y Plano */}
            <div className="flex flex-col items-center justify-center bg-slate-950/90 border border-slate-800/80 rounded-xl p-6 relative">
              <img
                src={product.images[0] || '/assets/products/ayme-001.svg'}
                alt={product.name}
                className="max-h-72 w-auto object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
              />

              <div className="mt-6 w-full text-center">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Presentación de Despacho
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  Fardo Termoencogible x {packSize} unidades
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Pedido Mínimo Industrial: {minQty.toLocaleString()} uds ({minPacks} fardos)
                </div>
              </div>
            </div>

            {/* Columna Derecha: Especificaciones Técnicas y Controles */}
            <div className="flex flex-col justify-between space-y-5">
              <div>
                <h3 className="text-xl font-bold text-white leading-snug">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Tabla de Ficha Técnica */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5" />
                  Especificaciones de Fabricación
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-2 font-mono divide-y divide-slate-800/60">
                  {specs.capacidad && (
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Capacidad Nominal:</span>
                      <span className="text-white font-semibold">{specs.capacidad}</span>
                    </div>
                  )}
                  {specs.boca && (
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Rosca / Boca:</span>
                      <span className="text-sky-400 font-bold">{specs.boca}</span>
                    </div>
                  )}
                  {specs.gramaje && (
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Gramaje Preforma:</span>
                      <span className="text-white font-semibold">{specs.gramaje}</span>
                    </div>
                  )}
                  {specs.altura && (
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Altura Total:</span>
                      <span className="text-slate-300">{specs.altura}</span>
                    </div>
                  )}
                  {specs.diametro && (
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Diámetro de Cuerpo:</span>
                      <span className="text-slate-300">{specs.diametro}</span>
                    </div>
                  )}
                  {specs.material && (
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Resina / Grado:</span>
                      <span className="text-emerald-400 font-medium">{specs.material}</span>
                    </div>
                  )}
                  {specs.resistencia && (
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Resistencia / Presión:</span>
                      <span className="text-amber-400">{specs.resistencia}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Características Clave / Inocuidad */}
              {features.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Certificaciones & Aplicación
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {features.slice(0, 3).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Selector de Fardos y Botones de Acción */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Fardos requeridos:</span>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setPackageCount(Math.max(minPacks, packageCount - 1))}
                      disabled={packageCount <= minPacks}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold font-mono px-2 text-white">
                      {packageCount} fardos
                    </span>
                    <button
                      onClick={() => setPackageCount(packageCount + 1)}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total calculado:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {totalUnits.toLocaleString()} unidades
                  </span>
                </div>

                {addedAlert && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs py-1.5 px-3 rounded-lg text-center font-medium animate-fade-in">
                    ✓ ¡Agregado al Cotizador exitosamente!
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAddToCart}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar al Cotizador
                  </button>
                  <button
                    onClick={handleDirectWhatsAppQuote}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Cotizar por WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
