'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingCart,
  MessageCircle,
  Package,
  Plus,
  ArrowRight,
  ShieldCheck,
  Tag,
  LayoutDashboard,
  CheckCircle2,
  Store,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { Tenant, Branch, Category, Product } from '@/lib/types';
import { useCartStore } from '@/lib/store/cart';
import CartDrawer from '@/components/CartDrawer';
import ProductDetailModal from '@/components/ProductDetailModal';

interface TenantCatalogViewProps {
  tenant: Tenant;
  categories: Category[];
  products: Product[];
  branches: Branch[];
  isAdmin?: boolean;
}

export default function TenantCatalogView({
  tenant,
  categories,
  products,
  branches,
  isAdmin = false,
}: TenantCatalogViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch>(branches[0] || null);

  const { openCart, addItem, getTotalUnits, getTotalPackages } = useCartStore();

  const totalCartUnits = getTotalUnits();
  const totalCartPackages = getTotalPackages();
  const primaryColor = tenant.theme_config?.primary_color || '#0284c7';
  const mainWhatsapp = selectedBranch?.phone_whatsapp || tenant.landing_config?.whatsapp_default;
  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  // Filtrado reactivo en vivo por categoría y búsqueda
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleQuickAdd = (p: Product) => {
    const packSize = p.units_per_package || 1;
    const minQty = p.min_order_qty || packSize;
    const packs = Math.ceil(minQty / packSize);
    addItem(p, packs, 'Estándar');
    openCart();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-24 selection:bg-sky-500 selection:text-white">
      {/* Drawer del Carrito Cotizador */}
      <CartDrawer
        tenant={tenant}
        branches={branches}
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
      />

      {/* Modal Técnico de Producto */}
      <ProductDetailModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        tenant={tenant}
        selectedBranch={selectedBranch}
      />

      {/* =========================================================================
          1. HEADER ULTRA-COMPACTO DE COMERCIO DIRECTO
          ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
        {/* Barra superior con marca y acciones */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Logo y Nombre */}
          <div className="flex items-center gap-2.5 min-w-0">
            {tenant.logo_url ? (
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 bg-white p-0.5 shrink-0 flex items-center justify-center">
                <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-white text-base shadow-sm shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {tenant.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight truncate">
                {tenant.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="truncate">Venta Mayorista Directa</span>
              </div>
            </div>
          </div>

          {/* Acciones del Header */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <Link
                href={`/store/${tenant.slug}/admin`}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-300 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Volver a la administración de tu tienda"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Volver a Mi Panel</span>
                <span className="sm:hidden text-[11px]">Panel</span>
              </Link>
            )}

            {mainWhatsapp && (
              <a
                href={`https://wa.me/${mainWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Botón Carrito Cotizador */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalCartUnits > 0 && (
                <span className="bg-rose-500 text-white font-mono font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                  {totalCartPackages}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Buscador Integrado */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos, códigos, medidas..."
              className="w-full bg-slate-100 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            2. BARRA DE CATEGORÍAS CON BOTÓN DESPLEGABLE DE MEGA-MENÚ
            ========================================================================= */}
        <div className="bg-white border-t border-slate-100 px-3 sm:px-6 py-2 overflow-x-auto scrollbar-none relative">
          <div className="max-w-7xl mx-auto flex items-center gap-2 shrink-0">
            {/* Botón Desplegable de Categorías */}
            <button
              type="button"
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isMegaMenuOpen
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Categorías</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isMegaMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <button
              onClick={() => {
                setSelectedCategory('all');
                setIsMegaMenuOpen(false);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🔥 Todos los Productos
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  setIsMegaMenuOpen(false);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* =========================================================================
              MEGA-MENÚ DESPLEGABLE CON FOTOS CIRCULARES
              ========================================================================= */}
          {isMegaMenuOpen && (
            <div className="absolute left-0 right-0 top-full bg-white border-b border-slate-200 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Explorar Categorías & Colecciones
                    </h3>
                  </div>

                  <button
                    onClick={() => setIsMegaMenuOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {categories.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center italic">
                    No hay categorías activas en este momento.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 max-h-[60vh] overflow-y-auto py-1">
                    {categories.map((c) => {
                      const count = products.filter((p) => p.category_id === c.id).length;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(c.id);
                            setIsMegaMenuOpen(false);
                          }}
                          className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all text-center group cursor-pointer ${
                            selectedCategory === c.id
                              ? 'bg-sky-50/80 border border-sky-200'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 group-hover:border-slate-900 group-hover:scale-105 transition-all p-0.5 flex items-center justify-center shadow-xs">
                            {c.image_url ? (
                              <img
                                src={c.image_url}
                                alt={c.name}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <span className="font-extrabold text-lg text-slate-700">
                                {c.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 w-full">
                            <span className="font-bold text-[11px] sm:text-xs text-slate-800 line-clamp-1 group-hover:text-sky-600 transition-colors block">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {count} {count === 1 ? 'artículo' : 'artículos'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Banner Informativo Rápido */}
      <div className="bg-sky-600 text-white text-[11px] font-medium py-1.5 px-4 text-center">
        <span>📦 Pedidos y cotizaciones directas a fábrica por bulto, fardo o pallet con despacho nacional</span>
      </div>

      {/* =========================================================================
          3. GRILLA DENSA DE PRODUCTOS (2 COLUMNAS EN MÓVIL)
          ========================================================================= */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-6 py-4">
        {/* =========================================================================
            BARRA DE COLECCIONES CON FOTOS CIRCULARES
            ========================================================================= */}
        {categories.length > 0 && (
          <div className="mb-4 bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                  Explorar Colecciones
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {categories.length}
                </span>
              </div>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-700 cursor-pointer flex items-center gap-1 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-lg transition-colors"
                >
                  <span>Ver todas</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-start gap-3 sm:gap-5 overflow-x-auto pb-2 pt-1 scrollbar-none">
              {/* Botón circular "Todas" */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setIsMegaMenuOpen(false);
                }}
                className={`flex flex-col items-center gap-1.5 shrink-0 w-16 sm:w-20 group cursor-pointer transition-all ${
                  selectedCategory === 'all' ? 'scale-105' : 'opacity-85 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all p-0.5 shadow-xs ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2'
                      : 'bg-slate-100 text-slate-700 border-2 border-slate-200 group-hover:border-slate-400'
                  }`}
                >
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <span
                  className={`text-[11px] font-bold text-center line-clamp-1 leading-tight ${
                    selectedCategory === 'all' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  Todas
                </span>
                <span className="text-[9px] text-slate-400 font-mono -mt-1">
                  {products.length} arts.
                </span>
              </button>

              {/* Categorías con fotos circulares */}
              {categories.map((c) => {
                const count = products.filter((p) => p.category_id === c.id).length;
                const isSelected = selectedCategory === c.id;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setIsMegaMenuOpen(false);
                    }}
                    className={`flex flex-col items-center gap-1.5 shrink-0 w-16 sm:w-20 group cursor-pointer transition-all ${
                      isSelected ? 'scale-105' : 'hover:scale-102'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden transition-all p-0.5 flex items-center justify-center shadow-xs ${
                        isSelected
                          ? 'ring-2 ring-sky-600 ring-offset-2 border-2 border-sky-600 bg-sky-50'
                          : 'bg-slate-100 border-2 border-slate-200 group-hover:border-slate-800'
                      }`}
                    >
                      {c.image_url ? (
                        <img
                          src={c.image_url}
                          alt={c.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <span className="font-extrabold text-base sm:text-lg text-slate-700">
                            {c.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-semibold text-center line-clamp-2 leading-tight w-full ${
                        isSelected ? 'font-extrabold text-sky-700' : 'text-slate-700 group-hover:text-sky-600'
                      }`}
                    >
                      {c.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono -mt-1">
                      {count} {count === 1 ? 'art.' : 'arts.'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Indicador de Categoría Seleccionada */}
        {selectedCategory !== 'all' && activeCategoryObj && (
          <div className="flex items-center justify-between bg-sky-50/90 border border-sky-200 rounded-xl px-3 py-2 mb-3 shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-600" />
              <span className="text-xs font-bold text-sky-950">
                Colección: <span className="text-sky-700">{activeCategoryObj.name}</span>
              </span>
              <span className="text-[10px] text-sky-600 font-mono bg-sky-100/80 px-1.5 py-0.5 rounded-md font-bold">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'artículo' : 'artículos'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-lg border border-sky-200 shadow-2xs transition-colors"
            >
              <span>Ver todas</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 my-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron productos</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No hay coincidencias para "${searchQuery}". Intenta con otro término.`
                : 'Aún no hay productos publicados en esta categoría.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
            {filteredProducts.map((p) => {
              const packSize = p.units_per_package || 100;
              const minQty = p.min_order_qty || packSize;
              const imageSrc = p.images?.[0] || '/assets/products/ayme-001.svg';

              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all group"
                >
                  {/* Foto con Badges y Logo de Tienda */}
                  <div
                    onClick={() => setModalProduct(p)}
                    className="relative aspect-[3/4] bg-slate-50 flex items-center justify-center p-2 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={imageSrc}
                      alt={p.name}
                      className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Logo de la Empresa en la esquina de la foto */}
                    {tenant.logo_url && (
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-lg overflow-hidden bg-white/95 p-0.5 border border-slate-200/80 shadow-xs backdrop-blur-xs flex items-center justify-center z-10">
                        <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-contain" />
                      </div>
                    )}

                    {/* Badge MOQ / Volumen */}
                    <div className="absolute top-2 left-2 bg-slate-900/85 text-white font-mono text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs z-10">
                      Mín: {minQty.toLocaleString()} uds
                    </div>

                    {p.sku && (
                      <div className="absolute bottom-2 left-2 bg-slate-900/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs z-10">
                        CÓD: {p.sku}
                      </div>
                    )}
                  </div>

                  {/* Datos del Producto */}
                  <div className="p-2.5 sm:p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        onClick={() => setModalProduct(p)}
                        className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2 hover:text-sky-600 cursor-pointer"
                      >
                        {p.name}
                      </h3>

                      {/* Tallas y Colores en la Tarjeta */}
                      {(p.attributes?.specs?.tallas || p.attributes?.specs?.color) && (
                        <div className="flex flex-wrap gap-1 text-[10px] mt-1.5">
                          {p.attributes?.specs?.color && (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                              🎨 {p.attributes.specs.color}
                            </span>
                          )}
                          {p.attributes?.specs?.tallas && (
                            <span className="bg-sky-50 text-sky-700 border border-sky-100 px-1.5 py-0.5 rounded font-mono font-bold">
                              📏 {p.attributes.specs.tallas}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1.5">
                        <Package className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Fardo / Bulto x {packSize} uds</span>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <button
                        onClick={() => setModalProduct(p)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] py-1.5 px-2 rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Ficha
                      </button>
                      <button
                        onClick={() => handleQuickAdd(p)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Agregar fardo al cotizador"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Cotizar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* =========================================================================
          4. BARRA FLOTANTE INFERIOR DE CARRITO / WHATSAPP PARA MÓVIL
          ========================================================================= */}
      {totalCartUnits > 0 && (
        <div className="fixed bottom-4 inset-x-3 z-40 max-w-md mx-auto animate-fade-in">
          <div
            onClick={openCart}
            className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer border border-slate-800 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center font-bold text-white shadow">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold">Cotizador Listo</div>
                <div className="text-[11px] text-slate-300 font-mono">
                  {totalCartUnits.toLocaleString()} unidades ({totalCartPackages} bultos)
                </div>
              </div>
            </div>

            <button
              className="bg-white text-slate-900 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow"
            >
              <span>Ver Pedido</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer Minimalista */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} {tenant.name} — Plataforma B2B impulsada por tenddy.</p>
      </footer>
    </div>
  );
}
