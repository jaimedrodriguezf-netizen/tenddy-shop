'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Package,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  Send,
  MessageCircle,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  ShoppingCart,
  Plus,
  Eye,
  Candy,
  Sparkles
} from 'lucide-react';
import { Tenant, Branch, Category, Product } from '@/lib/types';
import { useCartStore } from '@/lib/store/cart';
import CartDrawer from '@/components/CartDrawer';
import ProductDetailModal from '@/components/ProductDetailModal';

interface TenantLandingViewProps {
  tenant: Tenant;
  categories: Category[];
  products: Product[];
  branches: Branch[];
}

export default function TenantLandingView({
  tenant,
  categories,
  products,
  branches,
}: TenantLandingViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<Branch>(branches[0] || null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'services' | 'branches'>('catalog');
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const { openCart, addItem, getTotalUnits, getTotalPackages } = useCartStore();

  const { landing_config: landing, theme_config: theme } = tenant;
  const mainWhatsapp = selectedBranch?.phone_whatsapp || landing.whatsapp_default;

  const totalCartUnits = getTotalUnits();
  const totalCartPackages = getTotalPackages();

  const isPlastics = tenant.industry_type === 'plastics';
  const isConfectionery = tenant.industry_type === 'confectionery';

  // Filtrar productos
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category_id === selectedCategory);

  const handleWhatsAppQuote = (productName?: string) => {
    let msg = `Hola ${tenant.name}, vengo desde su portal web.\n`;
    if (productName) {
      msg += `Deseo cotizar el producto: *${productName}*.\n`;
    } else {
      msg += `Deseo solicitar información y lista de precios mayorista.\n`;
    }
    if (selectedBranch) {
      msg += `Sucursal / Centro de distribución de interés: ${selectedBranch.name} (${selectedBranch.city}).`;
    }
    const url = `https://wa.me/${mainWhatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* Drawer del Carrito Cotizador */}
      <CartDrawer
        tenant={tenant}
        branches={branches}
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
      />

      {/* Modal Detallado de Producto */}
      <ProductDetailModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        tenant={tenant}
        selectedBranch={selectedBranch}
      />

      {/* Top Bar Corporativo */}
      <div className="bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400 py-2 px-4 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              {landing.plant_location || landing.address}
            </span>
            <span className="hidden md:flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              {landing.hours}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {branches.length > 1 && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Centro de Despacho:</span>
                <select
                  value={selectedBranch?.id}
                  onChange={(e) => {
                    const b = branches.find((item) => item.id === e.target.value);
                    if (b) setSelectedBranch(b);
                  }}
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-0.5 text-xs focus:outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.city} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <a
              href={`https://wa.me/${mainWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp: +{mainWhatsapp}
            </a>
          </div>
        </div>
      </div>

      {/* Header Principal */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-8 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-lg text-lg ${
                isConfectionery
                  ? 'bg-gradient-to-br from-rose-500 to-amber-500 shadow-rose-500/20'
                  : 'bg-gradient-to-br from-sky-500 to-blue-700 shadow-sky-500/20'
              }`}
            >
              {isConfectionery ? '🍬' : '♳'}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {tenant.name}
              </h1>
              <p
                className={`text-xs font-medium uppercase tracking-wider ${
                  isConfectionery ? 'text-rose-400' : 'text-sky-400'
                }`}
              >
                {isConfectionery
                  ? 'Distribución Mayorista B2B de Confitería'
                  : 'Soluciones en Envases PET & PP'}
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`transition-colors cursor-pointer ${
                activeTab === 'catalog'
                  ? isConfectionery
                    ? 'text-rose-400 border-b-2 border-rose-400 pb-1'
                    : 'text-sky-400 border-b-2 border-sky-400 pb-1'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Catálogo Mayorista
            </button>
            {landing.show_services && (
              <button
                onClick={() => setActiveTab('services')}
                className={`transition-colors cursor-pointer ${
                  activeTab === 'services'
                    ? 'text-sky-400 border-b-2 border-sky-400 pb-1'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Servicios Industriales
              </button>
            )}
            <button
              onClick={() => setActiveTab('branches')}
              className={`transition-colors cursor-pointer ${
                activeTab === 'branches'
                  ? isConfectionery
                    ? 'text-rose-400 border-b-2 border-rose-400 pb-1'
                    : 'text-sky-400 border-b-2 border-sky-400 pb-1'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Centros de Despacho
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {/* Botón Carrito Cotizador */}
            <button
              onClick={openCart}
              className="relative bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 p-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer"
              title="Ver Lista de Cotización"
            >
              <ShoppingCart
                className={`w-4 h-4 ${isConfectionery ? 'text-rose-400' : 'text-sky-400'}`}
              />
              <span className="hidden sm:inline text-xs font-semibold">Cotizador</span>
              {totalCartPackages > 0 && (
                <span className="bg-emerald-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                  {totalCartPackages}
                </span>
              )}
            </button>

            <button
              onClick={() => handleWhatsAppQuote()}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp Directo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[520px] flex items-center justify-center overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 z-0 opacity-25">
          {landing.hero_video_url ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source src={landing.hero_video_url} type="video/mp4" />
            </video>
          ) : (
            <div className="w-full h-full bg-slate-900 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center">
          <div
            className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6 font-semibold uppercase tracking-wider backdrop-blur-sm border ${
              isConfectionery
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
            }`}
          >
            {isConfectionery ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Abastecimiento B2B Mayorista
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                Planta de Inyección y Soplado B2B
              </>
            )}
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            {landing.hero_title}
          </h2>
          <p className="mt-6 text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {landing.hero_subtitle}
          </p>

          <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
            <button
              onClick={() => {
                setActiveTab('catalog');
                document
                  .getElementById('catalog-section')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg transition-all cursor-pointer text-white ${
                isConfectionery
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30'
              }`}
            >
              <Package className="w-5 h-5" />
              Ver Catálogo Mayorista ({products.length} Referencias)
            </button>
            <button
              onClick={openCart}
              className="bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <ShoppingCart
                className={`w-5 h-5 ${isConfectionery ? 'text-rose-400' : 'text-sky-400'}`}
              />
              Armar Pedido por Cajas / Pallets
            </button>
          </div>

          {/* Estadísticas de Negocio */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
              <div
                className={`text-2xl font-bold ${
                  isConfectionery ? 'text-rose-400' : 'text-sky-400'
                }`}
              >
                {isConfectionery ? '+50 Tn' : '+10M'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {isConfectionery ? 'Despacho Mensual' : 'Unidades / Mes'}
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-emerald-400">
                {isConfectionery ? 'INVIMA' : 'FDA & BPM'}
              </div>
              <div className="text-xs text-slate-400 mt-1">Registro Sanitario</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-amber-400">
                {isConfectionery ? 'Cajas Master' : '100%'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {isConfectionery ? 'Empaque Corrugado' : 'PET / PP Virgen'}
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-indigo-400">Palletizado</div>
              <div className="text-xs text-slate-400 mt-1">Despacho Nacional</div>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Productos B2B */}
      <section id="catalog-section" className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              {isConfectionery
                ? 'Catálogo Mayorista de Chocolates y Golosinas'
                : 'Catálogo Industrial de Envases y Accesorios'}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {isConfectionery
                ? 'Precios y escalas por volumen en cajas máster y pallets para distribución.'
                : 'Fichas técnicas estandarizadas con medidas de boca, rosca, altura y gramaje.'}
            </p>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <SlidersHorizontal
              className={`w-3.5 h-3.5 ${isConfectionery ? 'text-rose-400' : 'text-sky-400'}`}
            />
            Mostrando {filteredProducts.length} productos
          </div>
        </div>

        {/* Filtros de Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? isConfectionery
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? isConfectionery
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid de Productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const specs = product.attributes?.specs || {};
            const badge = product.attributes?.badge;
            const packSize = product.units_per_package || 1;

            return (
              <div
                key={product.id}
                className={`bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden transition-all flex flex-col group ${
                  isConfectionery
                    ? 'hover:border-rose-500/50'
                    : 'hover:border-sky-500/50'
                }`}
              >
                {/* Visual del Producto */}
                <div
                  onClick={() => setModalProduct(product)}
                  className="relative h-56 bg-slate-950/80 flex items-center justify-center p-6 border-b border-slate-800/80 cursor-pointer"
                >
                  {badge && (
                    <span
                      className={`absolute top-3 left-3 border text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isConfectionery
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                  <span className="absolute top-3 right-3 text-slate-500 text-[10px] font-mono">
                    {product.sku}
                  </span>

                  <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {isConfectionery ? '🍬' : '♳'}
                  </div>

                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                    <span
                      className={`text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg ${
                        isConfectionery ? 'bg-rose-600/90' : 'bg-sky-600/90'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ficha Técnica
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col">
                  <h4
                    onClick={() => setModalProduct(product)}
                    className="font-bold text-white text-base line-clamp-2 mb-2 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {product.name}
                  </h4>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-4">
                    {product.description}
                  </p>

                  {/* Tabla de Specs Rápidas */}
                  <div
                    onClick={() => setModalProduct(product)}
                    className="bg-slate-950/60 rounded-lg p-3 text-xs space-y-1.5 border border-slate-800/50 mb-4 font-mono cursor-pointer hover:border-slate-700 transition-colors"
                  >
                    {Object.entries(specs)
                      .slice(0, 3)
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-500 capitalize">{k.replace('_', ' ')}:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[150px]">
                            {String(v)}
                          </span>
                        </div>
                      ))}
                  </div>

                  <div className="mt-auto pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">
                        {isConfectionery ? 'Caja / Display' : 'Fardo de Fábrica'}
                      </div>
                      <div className="text-xs font-bold text-slate-200">
                        {packSize} uds / caja
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => addItem(product)}
                        className={`text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-md ${
                          isConfectionery
                            ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                            : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20'
                        }`}
                        title="Agregar caja al cotizador"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                      <button
                        onClick={() => handleWhatsAppQuote(product.name)}
                        className="bg-slate-800 hover:bg-slate-700 text-emerald-400 p-2 rounded-lg transition-colors cursor-pointer"
                        title="Cotizar directo"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Red de Sucursales y Centros de Despacho */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isConfectionery ? 'text-rose-400' : 'text-sky-400'
            }`}
          >
            Cobertura y Logística B2B
          </span>
          <h3 className="text-3xl font-bold text-white mt-2">
            Centros de Distribución & Sucursales
          </h3>
          <p className="text-slate-400 text-sm mt-2">
            Atención comercial y despacho directo según tu zona de distribución.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {branches.map((b) => (
            <div
              key={b.id}
              className={`p-6 rounded-xl border transition-all ${
                selectedBranch?.id === b.id
                  ? isConfectionery
                    ? 'bg-slate-900 border-rose-500/80 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-900 border-sky-500/80 shadow-lg shadow-sky-500/10'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded ${
                    isConfectionery
                      ? 'text-rose-400 bg-rose-500/10'
                      : 'text-sky-400 bg-sky-500/10'
                  }`}
                >
                  {b.city}
                </span>
                {b.is_main_branch && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    CEDI Principal
                  </span>
                )}
              </div>
              <h4 className="font-bold text-white text-lg mb-2">{b.name}</h4>
              <p className="text-xs text-slate-400 flex items-start gap-2 mb-2">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                {b.address}
              </p>
              {b.phone_number && (
                <p className="text-xs text-slate-400 flex items-center gap-2 mb-4">
                  <Phone className="w-4 h-4 text-slate-500" />
                  {b.phone_number}
                </p>
              )}

              <a
                href={`https://wa.me/${b.phone_whatsapp}?text=${encodeURIComponent(
                  `Hola, me comunico con ${b.name} para cotizar pedido mayorista.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-4 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contactar Sede (+{b.phone_whatsapp})
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Corporativo */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="text-white font-bold text-base mb-1">{tenant.name}</div>
            <p className="text-slate-500">
              © {new Date().getFullYear()} Todos los derechos reservados. Plataforma B2B impulsada por tenddy.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Inocuidad & Registro Sanitario Aprobado
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Despacho Paletizado Asegurado
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
