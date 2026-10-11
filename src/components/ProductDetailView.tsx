'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  Star,
  CheckCircle2,
  Scissors,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { Product, Tenant, Branch, Category } from '@/lib/types';
import { useCartStore } from '@/lib/store/cart';
import CartDrawer from '@/components/CartDrawer';

interface ProductDetailViewProps {
  product: Product;
  onBack?: () => void;
  backHref?: string;
  tenant: Tenant;
  selectedBranch: Branch | null;
  branches: Branch[];
  categories: Category[];
}

export default function ProductDetailView({
  product,
  onBack,
  backHref,
  tenant,
  selectedBranch,
  branches = [],
  categories = [],
}: ProductDetailViewProps) {
  const { addItem, openCart, getTotalPackages } = useCartStore();
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(
    selectedBranch || branches[0] || null
  );

  const specs = product.attributes?.specs || {};
  const badge = product.attributes?.badge;
  const isSquare = product.attributes?.aspect_ratio === 'square';
  const packSize = product.units_per_package || 100;
  const minQty = product.min_order_qty || packSize;
  const minPacks = Math.ceil(minQty / packSize);

  // Imágenes multi-ángulo (frente, espalda, costados)
  const images = (product.images && product.images.length > 0 && (!product.images[0].includes('ayme-001.svg') || tenant.slug === 'ayme-pet' || tenant.industry_type === 'plastics'))
    ? product.images
    : ['/assets/placeholder-product.svg'];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [packageCount, setPackageCount] = useState<number>(minPacks);
  const [addedAlert, setAddedAlert] = useState(false);

  // Extraer tallas y colores de las especificaciones
  const rawColors = specs.color || specs.variante || '';
  const availableColors = rawColors
    ? rawColors.split(/[,/•;]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  const rawSizes = specs.tallas || specs.capacidad || '';
  const availableSizes = rawSizes
    ? rawSizes.split(/[,/•;]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || 'Color Principal');
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || 'Estándar');

  const targetWhatsapp = currentBranch?.phone_whatsapp || tenant.landing_config?.whatsapp_default;
  const totalUnits = packageCount * packSize;
  const totalCartPackages = getTotalPackages();
  const categoryObj = categories.find((c) => c.id === product.category_id);

  const handleAddToCart = () => {
    const variantLabel = `${selectedColor} • Talla ${selectedSize}`;
    addItem(product, packageCount, variantLabel);
    setAddedAlert(true);
    openCart();
    setTimeout(() => setAddedAlert(false), 2500);
  };

  const handleDirectWhatsAppQuote = () => {
    let msg = `*CONSULTA DE PRENDA Y COTIZACIÓN*\n`;
    msg += `Prenda: *${product.name}*\n`;
    if (product.sku) msg += `Código SKU: *${product.sku}*\n`;
    if (selectedColor) msg += `Color seleccionado: *${selectedColor}*\n`;
    if (selectedSize) msg += `Talla seleccionada: *${selectedSize}*\n`;
    msg += `Cantidad requerida: *${totalUnits.toLocaleString()} unidades* (${packageCount} fardos/bultos)\n`;
    if (currentBranch) {
      msg += `Sucursal o despacho: ${currentBranch.name} (${currentBranch.city})\n`;
    }
    const url = `https://wa.me/${targetWhatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-28 selection:bg-sky-500 selection:text-white">
      {/* Drawer del Carrito Cotizador */}
      <CartDrawer
        tenant={tenant}
        branches={branches}
        selectedBranch={currentBranch}
        onSelectBranch={setCurrentBranch}
      />
      {/* Header Superior Integrado de Navegación */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {backHref ? (
              <Link
                href={backHref}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 group"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
                <span>Volver al Catálogo</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 group"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
                <span>Volver al Catálogo</span>
              </button>
            )}

            {/* Breadcrumb Comercial */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">{tenant.name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              {categoryObj && (
                <>
                  <span className="font-medium text-slate-600">{categoryObj.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </>
              )}
              <span className="font-bold text-slate-900 truncate max-w-xs">{product.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {targetWhatsapp && (
              <a
                href={`https://wa.me/${targetWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={openCart}
              className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Ver cotización actual"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalCartPackages > 0 && (
                <span className="bg-rose-500 text-white font-mono font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                  {totalCartPackages}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal de la Ficha de Producto (Página Completa) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =========================================================================
              COLUMNA IZQUIERDA: GALERÍA MULTI-ÁNGULO (MINIATURAS + FOTO PRINCIPAL)
              ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Tira de Miniaturas (Frente, Espalda, Lados, Detalle) */}
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[580px] pb-2 sm:pb-0 scrollbar-thin shrink-0">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-20 sm:w-20 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-white cursor-pointer shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-slate-900 shadow-md scale-102 ring-2 ring-slate-900/20'
                        : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} vista ${idx + 1}`}
                      className="w-full h-full object-contain rounded-xl"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Visor de Foto Principal Amplia */}
            <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-3 sm:p-4 shadow-sm relative flex items-center justify-center overflow-hidden group">
              <div className={`w-full relative flex items-center justify-center rounded-2xl overflow-hidden bg-slate-50 ${
                isSquare ? 'aspect-square max-h-[580px]' : 'aspect-[3/4] max-h-[620px]'
              }`}>
                <img
                  src={images[activeImageIndex] || images[0]}
                  alt={product.name}
                  className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-102"
                />

                {/* Badge Superior Izquierdo: Insignia Comercial */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  <span className="bg-slate-900/90 text-amber-300 backdrop-blur-xs text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                    <span>Vendedor Estrella</span>
                  </span>
                  {badge && (
                    <span className="bg-emerald-600/95 text-white backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                      {badge}
                    </span>
                  )}
                </div>

                {/* SKU Badge */}
                {product.sku && (
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 text-white font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs shadow-sm">
                    CÓD: {product.sku}
                  </div>
                )}

                {/* Logo de la Empresa en la Esquina */}
                {tenant.logo_url && (
                  <div className="absolute top-3 right-3 w-9 h-9 rounded-xl overflow-hidden bg-white/95 p-1 border border-slate-200/80 shadow-sm backdrop-blur-xs flex items-center justify-center z-10">
                    <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =========================================================================
              COLUMNA DERECHA: ESPECIFICACIONES, TALLAS, COLORES Y PEDIDO
              ========================================================================= */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
            {/* Título & Valoración */}
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                {product.sku && (
                  <span className="font-mono text-slate-800 text-xs font-bold bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                    SKU: {product.sku}
                  </span>
                )}
                <span className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                  Venta Mayorista
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {product.name}
              </h2>

              {/* Estrellas y Demanda */}
              <div className="flex items-center flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 font-mono">5.0</span>
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <span>🔥</span>
                  <span className="font-bold text-slate-800 font-mono">+120</span> pedidos despachados
                </span>
              </div>
            </div>

            {/* Selector de Colores Disponibles */}
            {availableColors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🎨 Color / Variante:</span>
                    <span className="font-extrabold text-sky-700">{selectedColor}</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {availableColors.length} disponibles
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableColors.map((col, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedColor === col
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs scale-102'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Tallas Disponibles */}
            {availableSizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>📏 Tallas disponibles:</span>
                    <span className="font-extrabold text-sky-700">{selectedSize}</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Curva completa
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((sz, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                        selectedSize === sz
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs scale-105'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Detalles de Patronaje y Confección */}
            {specs.costuras_patronaje && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-slate-700" />
                  <span>Detalles de Confección & Patronaje</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">
                  {specs.costuras_patronaje}
                </p>
              </div>
            )}

            {/* Descripción Comercial */}
            {product.description && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900">Descripción:</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Selector de Embalaje y Cantidad por Fardos */}
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Presentación de Despacho:</span>
                <span className="font-bold text-slate-900">Fardo / Bulto x {packSize} unidades</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-sky-100">
                <div>
                  <div className="font-bold text-xs text-slate-900">Cantidad de Fardos</div>
                  <div className="text-[11px] text-sky-700 font-mono font-bold mt-0.5">
                    Total: {totalUnits.toLocaleString()} prendas
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white border border-sky-200 rounded-xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setPackageCount((prev) => Math.max(minPacks, prev - 1))}
                    disabled={packageCount <= minPacks}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold font-mono text-sm text-slate-900">
                    {packageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPackageCount((prev) => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Alerta de Producto Agregado */}
            {addedAlert && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>¡Prenda agregada a tu cotizador con éxito!</span>
              </div>
            )}

            {/* Botones Principales de Compra y WhatsApp */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.01] cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Agregar al Cotizador ({packageCount} fardos)</span>
              </button>

              {targetWhatsapp && (
                <button
                  type="button"
                  onClick={handleDirectWhatsAppQuote}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Consultar Disponibilidad por WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
