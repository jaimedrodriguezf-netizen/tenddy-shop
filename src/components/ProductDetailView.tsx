'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  Star,
  CheckCircle2,
  ChevronRight,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  Lock,
  Heart,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  PackageCheck,
  Check,
  Layers,
  ZoomIn,
  X,
  ChevronLeft
} from 'lucide-react';
import { Product, Tenant, Branch, Category, getPackagingUnit, resolveTieredPrice } from '@/lib/types';
import { useCartStore } from '@/lib/store/cart';
import CartDrawer from '@/components/CartDrawer';
import { hasValidProductImage } from '@/lib/product-image';
import { resolveStorefrontTokens, buildStorefrontThemeCSS } from '@/lib/theme-tokens';

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

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAlert, setAddedAlert] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // Precios dinámicos y escalas mayoristas por volumen
  const currencySymbol = tenant.settings?.currency_symbol || '$';
  const basePriceFallback = specs.precio ? Number(specs.precio) : 3.14;
  const initialBasePrice = (product.price_tiers && product.price_tiers.length > 0 && typeof product.price_tiers[0].price === 'number')
    ? product.price_tiers[0].price
    : basePriceFallback;

  const { unitPrice, activeTier, savingsPercent } = resolveTieredPrice(product.price_tiers, quantity, initialBasePrice);
  const totalPrice = unitPrice * quantity;

  const originalPrice = specs.precio_original
    ? Number(specs.precio_original)
    : Math.round((initialBasePrice / 0.53) * 100) / 100; // ~47% de descuento
  const discountPercent = Math.max(15, Math.round(((originalPrice - unitPrice) / originalPrice) * 100));

  // Imágenes multi-ángulo y video
  const videoUrl = product.attributes?.video_url;
  const [isVideoActive, setIsVideoActive] = useState(false);
  const images = hasValidProductImage(product.images, tenant)
    ? product.images
    : ['/assets/placeholder-product.svg'];

  // Variantes de paquete y unidades de empaque dinámicas
  const packagingUnit = useMemo(() => getPackagingUnit(tenant), [tenant]);

  // Manejo de eventos de teclado y scroll para el Visor Ampliado (Zoom Lightbox)
  useEffect(() => {
    if (!isZoomOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomOpen(false);
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setZoomScale(1);
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setZoomScale(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isZoomOpen, images.length]);
  const defaultPackSize = product.units_per_package || 100;
  const defaultPacks = `${packagingUnit.singular} x ${defaultPackSize} uds, 5 ${packagingUnit.plural} (${defaultPackSize * 5} uds), 10 ${packagingUnit.plural} (${defaultPackSize * 10} uds)`;
  const rawPacks = specs.paquetes || specs.presentacion || defaultPacks;
  const packOptions = rawPacks.split(/[,/•;]+/).map((s: string) => s.trim()).filter(Boolean);
  const [selectedPack, setSelectedPack] = useState<string>(packOptions[0] || `${packagingUnit.singular} x ${defaultPackSize} uds`);

  // Variantes de tapa/color (ej: Tapas Negras, Tapas Blancas)
  const rawColors = specs.tapas || specs.color || specs.variante || 'Tapas Negras, Tapas Blancas';
  const colorOptions = rawColors.split(/[,/•;]+/).map((s: string) => s.trim()).filter(Boolean);
  const [selectedColor, setSelectedColor] = useState<string>(colorOptions[0] || 'Tapas Negras');

  // Temporizador dinámico sincronizado al final del mes actual (Días:Horas:Min:Seg)
  const calculateTimeRemaining = () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const diff = Math.max(0, endOfMonth.getTime() - now.getTime());
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format2 = (n: number) => String(n).padStart(2, '0');

  // Fechas dinámicas de oferta y despacho
  const offerEndText = useMemo(() => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `Termina el ${lastDayOfMonth.getDate()} ${monthNames[lastDayOfMonth.getMonth()]} a las 11:59 pm`;
  }, []);

  const deliveryEstimate = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]}`;
  }, []);

  // Breadcrumb comercial
  const categoryObj = categories.find((c) => c.id === product.category_id);
  const subcategory = specs.subcategoria || specs.sector || 'Cristalería y copas';
  const targetWhatsapp = currentBranch?.phone_whatsapp || tenant.landing_config?.whatsapp_default || '593998722324';
  const totalCartPackages = getTotalPackages(tenant.id);

  const primaryColor = tenant.theme_config?.primary_color || '#FB7701';
  const secondaryColor = tenant.theme_config?.secondary_color || '#111827';
  const themeTokens = useMemo(() => resolveStorefrontTokens(primaryColor, secondaryColor), [primaryColor, secondaryColor]);
  const themeStyles = useMemo(() => buildStorefrontThemeCSS(primaryColor, secondaryColor), [primaryColor, secondaryColor]);

  const handleAddToCart = () => {
    const variantLabel = `${selectedPack} • ${selectedColor}`;
    const productWithAppliedPrice: Product = {
      ...product,
      attributes: {
        ...(product.attributes || {}),
        price: unitPrice,
      },
    };
    addItem(productWithAppliedPrice, quantity, variantLabel);
    setAddedAlert(true);
    openCart();
    setTimeout(() => setAddedAlert(false), 3000);
  };

  const handleDirectWhatsAppQuote = () => {
    let msg = `🏭 *CONSULTA DE PRODUCTO - ${tenant.name.toUpperCase()}* 🏭\n\n`;
    msg += `📦 *Producto:* ${product.name}\n`;
    if (product.sku) msg += `🏷️ *SKU:* ${product.sku}\n`;
    msg += `📦 *Presentación elegida:* ${selectedPack}\n`;
    msg += `🎨 *Tapas / Color:* ${selectedColor}\n`;
    msg += `📊 *Cantidad requerida:* ${quantity} ${quantity === 1 ? packagingUnit.singular.toLowerCase() : packagingUnit.plural.toLowerCase()}\n`;
    msg += `💰 *Precio unitario aplicado:* ${currencySymbol}${unitPrice.toFixed(2)}/u${activeTier ? ` (Escala mayorista de ${activeTier.min_qty}+ uds)` : ''}\n`;
    msg += `💵 *Subtotal estimado:* ${currencySymbol}${totalPrice.toFixed(2)}\n\n`;
    if (currentBranch) {
      msg += `📍 *Despacho:* ${currentBranch.name} (${currentBranch.city})\n`;
    }
    msg += `Agradezco me confirmen stock disponible y tiempos de entrega.`;

    const url = `https://wa.me/${targetWhatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Muro de Reseñas de Clientes Verificadas
  const reviews = [
    {
      author: '98***28',
      date: 'el 24 abr 2026',
      rating: 5,
      headline: 'Excelente',
      content: 'bonitos botes, frasco un tanto delicado pero muy chéveres',
      verified: true,
    },
    {
      author: 'Lissett',
      date: 'el 2 abr 2026',
      rating: 5,
      headline: 'Excelente',
      content: 'Están muy bonitos eficientes para guardar juguitos',
      verified: true,
    },
    {
      author: 'ruben alvarez',
      date: 'el 22 ene 2026',
      rating: 5,
      headline: 'Excelente',
      content: 'llego muy bien gracias',
      verified: true,
    },
    {
      author: 'Ndeer Hp',
      date: 'el 29 abr 2026',
      rating: 4,
      headline: 'Bueno',
      content: 'JAJAJA otra vez pensé q sería más grandesito pero por su precio está bastante bien, cumple su función.',
      verified: true,
    },
  ];

  return (
    <div
      style={themeStyles}
      className="min-h-screen bg-[#F6F7F9] text-slate-900 font-sans pb-28 selection:bg-[var(--tenant-primary)] selection:text-[var(--tenant-primary-text)] w-full max-w-full overflow-x-hidden"
    >
      {/* Drawer del Carrito Cotizador */}
      <CartDrawer
        tenant={tenant}
        branches={branches}
        selectedBranch={currentBranch}
        onSelectBranch={setCurrentBranch}
      />

      {/* Header Superior Flotante Adaptativo */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
            {backHref ? (
              <Link
                href={backHref}
                onClick={(e) => {
                  if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer.includes(tenant.slug)) {
                    e.preventDefault();
                    window.history.back();
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                title="Volver al catálogo"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Volver</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Volver"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Volver</span>
              </button>
            )}

            {/* Móvil: Título de producto truncado sin desborde */}
            <div className="sm:hidden min-w-0 flex-1">
              <span className="font-bold text-xs text-slate-900 truncate block">
                {product.name}
              </span>
            </div>

            {/* Desktop: Breadcrumb Jerárquico Completo */}
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 min-w-0 flex-1 overflow-hidden py-1">
              <Link href={backHref || `/store/${tenant.slug}`} className="hover:text-slate-900 font-semibold shrink-0">
                Inicio
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="hover:text-slate-900 font-medium shrink-0">
                {categoryObj?.name || (tenant.industry_type === 'plastics' ? 'Catálogo' : 'Hogar y cocina')}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="hover:text-slate-900 font-medium shrink-0">
                {subcategory}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="font-bold text-slate-900 truncate">
                {product.name}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isSaved ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title={isSaved ? 'Guardado en favoritos' : 'Guardar artículo'}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={openCart}
              style={{ backgroundColor: themeTokens.secondary, color: themeTokens.secondaryText }}
              className="relative p-2 px-2.5 sm:px-3 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer font-bold text-xs hover:brightness-110 active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Carrito</span>
              {totalCartPackages > 0 && (
                <span
                  style={{ backgroundColor: themeTokens.primary, color: themeTokens.primaryText }}
                  className="font-mono font-extrabold text-[10px] px-1.5 py-0.2 rounded-full shadow-2xs"
                >
                  {totalCartPackages}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full max-w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start w-full min-w-0">
          
          {/* =========================================================================
              COLUMNA IZQUIERDA: GALERÍA DE IMÁGENES MULTI-ÁNGULO Y VIDEO (7 COLUMNAS)
              ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-3 bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs w-full max-w-full overflow-hidden">
            {/* Tira de Miniaturas */}
            {(images.length > 1 || videoUrl) && (
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-[580px] pb-1 sm:pb-0 scrollbar-none shrink-0 w-full sm:w-auto">
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => setIsVideoActive(true)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all p-1 bg-slate-900 cursor-pointer shrink-0 flex flex-col items-center justify-center text-white ${
                      isVideoActive
                        ? 'border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-300 hover:border-slate-500 opacity-90 hover:opacity-100'
                    }`}
                    title="Ver Video del Producto"
                  >
                    <span className="text-emerald-400 text-xs font-black">▶</span>
                    <span className="text-[9px] font-bold tracking-tight uppercase">Video</span>
                  </button>
                )}
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setIsVideoActive(false);
                      setActiveImageIndex(idx);
                    }}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-slate-50 cursor-pointer shrink-0 ${
                      !isVideoActive && activeImageIndex === idx
                        ? 'border-orange-500 shadow-xs ring-2 ring-orange-500/20'
                        : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} detalle ${idx}`}
                      className="w-full h-full object-contain rounded-lg"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Visor Principal de Imagen o Video */}
            <div
              onClick={() => {
                if (!isVideoActive) {
                  setIsZoomOpen(true);
                  setZoomScale(1);
                }
              }}
              className={`flex-1 relative flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 overflow-hidden group aspect-square sm:aspect-auto sm:min-h-[520px] w-full ${
                !isVideoActive ? 'cursor-zoom-in' : ''
              }`}
            >
              {isVideoActive && videoUrl ? (
                <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 bg-slate-950">
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full max-h-[360px] sm:max-h-[540px] object-contain rounded-lg"
                  />
                </div>
              ) : (
                <>
                  <img
                    src={images[activeImageIndex] || images[0]}
                    alt={product.name}
                    className="w-full h-full max-h-[360px] sm:max-h-[540px] object-contain p-2 sm:p-4 filter drop-shadow-sm transition-transform duration-300 group-hover:scale-103"
                  />
                  {/* Indicador sutil de ampliación en hover */}
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 pointer-events-none shadow-md">
                    <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
                    <span>Clic para ampliar</span>
                  </div>
                </>
              )}

              {/* Badges Flotantes sobre la Imagen */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                <span className="bg-red-600 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1 uppercase tracking-wide">
                  <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-pulse" />
                  <span>Oferta de temporada</span>
                </span>
                {badge && (
                  <span className="bg-slate-900/90 text-white backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    {badge}
                  </span>
                )}
              </div>

              {/* Marca de agua / Logo del Fabricante */}
              {tenant.logo_url && (
                <div className="absolute bottom-3 right-3 bg-white/95 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5">
                  <img src={tenant.logo_url} alt={tenant.name} className="h-5 sm:h-6 w-auto object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              COLUMNA DERECHA: PRECIO, COUNTDOWN, URGENCIA Y COMPRA (5 COLUMNAS)
              ========================================================================= */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Tarjeta de Título, Precios y Contador */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
              
              {/* Título Principal */}
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {product.name}
              </h1>

              {/* Métricas Sociales: Reseñas & Ventas */}
              <div className="flex items-center flex-wrap gap-2.5 text-xs pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded-md border border-amber-200/80">
                  <div className="flex text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                  <span className="font-mono text-xs">4,8</span>
                </div>
                <span className="text-slate-600 hover:text-slate-900 underline cursor-pointer">
                  843 reseñas
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-slate-700">14K+ ventas</span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                  <span>Compras verificadas</span>
                </span>
              </div>

              {/* BLOQUE DE PRECIOS & DESCUENTO LLAMATIVO */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50/70 border border-red-200/90 rounded-2xl p-3.5 sm:p-4 space-y-2">
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight font-mono">
                    {currencySymbol}{unitPrice.toFixed(2)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-400 line-through font-mono">
                    {currencySymbol}{originalPrice.toFixed(2)}
                  </span>
                  <span className="bg-red-600 text-white font-black text-[10px] sm:text-[11px] px-2 py-0.5 rounded uppercase tracking-wider inline-block">
                    {discountPercent}% DE DESCUENTO tiempo limitado
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-red-700 font-extrabold flex items-center gap-1 text-[11px] sm:text-xs">
                    <Flame className="w-4 h-4 fill-red-600 text-red-600" />
                    <span>CASI AGOTADO(S)</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                    {product.sku && `SKU: ${product.sku}`}
                  </span>
                </div>

                {/* BANNER TEMPORIZADOR DE CUENTA REGRESIVA */}
                <div className="bg-white/90 rounded-xl p-2.5 border border-red-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Clock className="w-4 h-4 text-red-600 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Oferta de temporada</span>
                  </div>
                  <div
                    className="flex items-center gap-1 font-mono font-bold text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200"
                    suppressHydrationWarning
                  >
                    <span suppressHydrationWarning>{format2(timeLeft.days)}</span>:
                    <span suppressHydrationWarning>{format2(timeLeft.hours)}</span>:
                    <span suppressHydrationWarning>{format2(timeLeft.minutes)}</span>:
                    <span suppressHydrationWarning>{format2(timeLeft.seconds)}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-right" suppressHydrationWarning>
                  {offerEndText}
                </div>

                {/* ESCALAS DE PRECIO MAYORISTA POR VOLUMEN */}
                {product.price_tiers && product.price_tiers.length > 0 && (
                  <div className="pt-2.5 border-t border-red-200/70 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-red-600" />
                        <span>Precios por Escala Mayorista:</span>
                      </span>
                      {activeTier && (
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                          Activo: {currencySymbol}{unitPrice.toFixed(2)}/u ({activeTier.min_qty}+ uds)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {product.price_tiers.map((tier, idx) => {
                        const isCurrentActive = activeTier?.min_qty === tier.min_qty;
                        const tierSavings = initialBasePrice > tier.price && initialBasePrice > 0
                          ? Math.round(((initialBasePrice - tier.price) / initialBasePrice) * 100)
                          : 0;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setQuantity(tier.min_qty)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              isCurrentActive
                                ? 'bg-red-500/15 border-red-500 shadow-2xs ring-1 ring-red-500/50'
                                : 'bg-white/80 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono">
                              {tier.min_qty}+ {tier.min_qty === 1 ? 'unidad' : 'unidades'}
                            </span>
                            <span className="text-sm font-black text-slate-900 font-mono block">
                              {currencySymbol}{tier.price.toFixed(2)}
                              <span className="text-[10px] font-normal text-slate-400">/u</span>
                            </span>
                            {tierSavings > 0 ? (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono mt-0.5 inline-block">
                                -{tierSavings}% OFF
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-mono mt-0.5 inline-block">
                                Base
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Selector de Paquete / Presentación */}
              {packOptions.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Presentación / Paquete:</span>
                    <span className="text-orange-600 font-extrabold">{selectedPack}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {packOptions.map((pack: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPack(pack)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selectedPack === pack
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs scale-102'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pack}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de Tapas / Colores */}
              {colorOptions.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Color de Tapas / Acabado:</span>
                    <span className="text-orange-600 font-extrabold">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((col: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selectedColor === col
                            ? 'bg-orange-500 text-white border-orange-500 shadow-2xs scale-102'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de Cantidad */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-800">Cantidad:</span>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center text-slate-700 border border-slate-200 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold font-mono text-xs text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notificación de Producto Agregado */}
              {addedAlert && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Artículo agregado a tu lista de compra!</span>
                </div>
              )}

              {/* Botones de Acción Primarios */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  style={{ backgroundColor: themeTokens.primary, color: themeTokens.primaryText }}
                  className="w-full font-extrabold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all hover:brightness-110 active:scale-[0.99] cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Agregar al Carrito ({quantity} {quantity === 1 ? packagingUnit.singular.toLowerCase() : packagingUnit.plural.toLowerCase()})</span>
                </button>

                {targetWhatsapp && (
                  <button
                    type="button"
                    onClick={handleDirectWhatsAppQuote}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Cotizar por WhatsApp</span>
                  </button>
                )}
              </div>
            </div>

            {/* TARJETA DE LOGÍSTICA & ENVÍO A DOMICILIO */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>A domicilio</span>
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                      Envío gratis para este artículo
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Entrega estimada: <strong className="text-slate-900">{deliveryEstimate} (2 a 5 días hábiles)</strong>
                  </div>
                </div>
              </div>

              {/* Transportistas Autorizados */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Transportistas oficiales:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['FAR International', 'LAARCOURIER', 'URBANO ENVÍOS'].map((courier, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-2 py-1 rounded-md border border-slate-200"
                    >
                      {courier}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sellos de Garantía y Seguridad */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-700">
                <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-xl">
                  <Lock className="w-3.5 h-3.5 text-slate-700" />
                  <span>Pagos seguros</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-xl">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                  <span>Privacidad segura</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-xl">
                  <PackageCheck className="w-3.5 h-3.5 text-slate-700" />
                  <span>Garantía de pedidos</span>
                </div>
              </div>
            </div>

            {/* TARJETA DE INFORMACIÓN DEL VENDEDOR (WL damai / Tenant) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {tenant.logo_url ? (
                    <div className="h-10 w-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                      <img src={tenant.logo_url} alt={tenant.name} className="max-h-8 max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs">
                      {tenant.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1">
                      <span>{specs.vendedor || tenant.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-50" />
                    </h3>
                    <p className="text-[10px] text-slate-500">Fabricante & Vendedor Oficial</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-extrabold text-xs text-amber-500 flex items-center justify-end gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>4.8</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">Comenzó hace 1 año</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-center">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="block font-bold text-xs text-slate-900 font-mono">66</span>
                  <span className="text-[10px] text-slate-500">Seguidores</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="block font-bold text-xs text-slate-900 font-mono">83K+</span>
                  <span className="text-[10px] text-slate-500">Vendidos</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* =========================================================================
            SECCIÓN INFERIOR: DETALLES DEL PRODUCTO (ESPECIFICACIONES) Y RESEÑAS
            ========================================================================= */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Columna Izquierda: Ficha Técnica & Especificaciones (7 Columnas) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">
                Detalles del producto
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaved(!isSaved)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'Guardado' : 'Guardar'}</span>
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Reportar</span>
                </button>
              </div>
            </div>

            {/* Grid de Atributos del Producto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Material:</span>
                <span className="font-bold text-slate-900">{specs.material || 'Plástico (PET / PP)'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Reutilizable:</span>
                <span className="font-bold text-slate-900">{specs.reutilizable || 'Reutilizable 100%'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Forma:</span>
                <span className="font-bold text-slate-900">{specs.forma || 'Redondo / Cilíndrico'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Capacidad:</span>
                <span className="font-bold text-slate-900">{specs.capacidad || '2 Oz (60 ml)'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Tipo de Cierre:</span>
                <span className="font-bold text-slate-900">{specs.boca || 'Tapa Rosca Hermética'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Uso Recomendado:</span>
                <span className="font-bold text-slate-900">{specs.uso || specs.aplicacion || 'Bebidas, Alimentos, Farma, Químicos'}</span>
              </div>
            </div>

            {/* Descripción Completa */}
            {product.description && (
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-900 mb-1">Descripción:</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Acordeón de Todas las Dimensiones y Detalles */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAllSpecs(!showAllSpecs)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                <span>Ver todos los detalles y dimensiones técnicas</span>
                {showAllSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAllSpecs && (
                <div className="mt-2 p-3.5 sm:p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(specs).map(([k, v], idx) => (
                      <div key={idx} className="flex justify-between border-b border-slate-200/60 pb-1 gap-2">
                        <span className="text-slate-500 capitalize">{k}:</span>
                        <span className="font-bold text-slate-900 text-right break-words max-w-[65%]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Muro de Reseñas de Clientes Verificadas (5 Columnas) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>843 reseñas</span>
                  <span className="text-xs bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-200">
                    ★ 4,8
                  </span>
                </h2>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  Todas las reseñas son de compras verificadas
                </p>
              </div>
            </div>

            {/* Listado de Reseñas */}
            <div className="space-y-3.5 divide-y divide-slate-100">
              {reviews.map((rev, idx) => (
                <article key={idx} className={idx > 0 ? 'pt-3' : ''}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>{rev.author}</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                        Verificada
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{rev.date}</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 my-1">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                    <span className="text-xs font-bold text-slate-900 ml-1">{rev.headline}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rev.content}
                  </p>
                </article>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* =========================================================================
          MODAL DE VISOR AMPLIADO / ZOOM LIGHTBOX DE FOTOS DE PRODUCTO
          ========================================================================= */}
      {isZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 select-none animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsZoomOpen(false);
          }}
        >
          {/* Cabecera del Visor */}
          <div className="flex items-center justify-between text-white z-20 w-full max-w-6xl mx-auto pb-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-xs sm:text-sm font-bold bg-white/10 px-2.5 py-1 rounded-lg">
                Foto {activeImageIndex + 1} de {images.length}
              </span>
              <span className="hidden sm:inline text-xs text-slate-300 truncate max-w-md">
                {product.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => (prev === 1 ? 2 : 1))}
                className="text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Alternar nivel de aumento"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{zoomScale === 1 ? 'Aumentar (2x)' : 'Tamaño normal (1x)'}</span>
                <span className="sm:hidden">{zoomScale === 1 ? '2x' : '1x'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Cerrar visor"
                title="Cerrar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Área Central de Imagen */}
          <div
            className="flex-1 flex items-center justify-center relative overflow-hidden my-auto w-full max-w-6xl mx-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsZoomOpen(false);
            }}
          >
            {/* Navegación Anterior */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                  setZoomScale(1);
                }}
                className="absolute left-1 sm:left-4 z-30 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
                aria-label="Foto anterior"
                title="Foto anterior (←)"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Contenedor Interactivo con Zoom */}
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-200"
              style={{
                transform: `scale(${zoomScale})`,
                cursor: zoomScale === 1 ? 'zoom-in' : 'zoom-out',
              }}
              onClick={() => setZoomScale((prev) => (prev === 1 ? 2 : 1))}
              title={zoomScale === 1 ? 'Clic para acercar' : 'Clic para alejar'}
            >
              <img
                src={images[activeImageIndex] || images[0]}
                alt={product.name}
                className="max-w-[92vw] max-h-[75vh] object-contain rounded-lg drop-shadow-2xl transition-all"
              />
            </div>

            {/* Navegación Siguiente */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                  setZoomScale(1);
                }}
                className="absolute right-1 sm:right-4 z-30 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
                aria-label="Foto siguiente"
                title="Foto siguiente (→)"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {/* Miniaturas de Acceso Rápido */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-20 max-w-full">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setZoomScale(1);
                  }}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-white scale-105 shadow-lg'
                      : 'border-white/20 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
