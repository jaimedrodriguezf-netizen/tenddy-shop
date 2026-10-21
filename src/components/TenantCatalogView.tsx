'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Flame,
  Star,
  TrendingUp,
  Zap,
  X,
  CornerDownRight,
  User,
  SlidersHorizontal,
  LogOut,
  Check,
  Clock,
  Truck
} from 'lucide-react';
import { Tenant, Branch, Category, Product } from '@/lib/types';
import { useCartStore } from '@/lib/store/cart';
import CartDrawer from '@/components/CartDrawer';
import ProductDetailView from '@/components/ProductDetailView';
import VersionBadge from '@/components/VersionBadge';
import { normalizeEcuadorPhone, buildEcuadorWhatsAppUrl } from '@/lib/ecuador-phone';
import { hasValidProductImage, getProductPrimaryImage } from '@/lib/product-image';
import { resolveStorefrontTokens, buildStorefrontThemeCSS } from '@/lib/theme-tokens';

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
  const [hoveredMegaRootId, setHoveredMegaRootId] = useState<string | null>(null);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch>(branches[0] || null);
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState<boolean>(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  type SortOption = 'recommended' | 'bestsellers' | 'min_qty_asc' | 'rating' | 'name_asc';
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [justAddedProductName, setJustAddedProductName] = useState<string>('');

  const [prevFilters, setPrevFilters] = useState({ category: selectedCategory, search: searchQuery });
  if (prevFilters.category !== selectedCategory || prevFilters.search !== searchQuery) {
    setPrevFilters({ category: selectedCategory, search: searchQuery });
    setVisibleCount(20);
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { openCart, addItem, getTotalUnits, getTotalPackages } = useCartStore();

  const totalCartUnits = getTotalUnits(tenant.id);
  const totalCartPackages = getTotalPackages(tenant.id);
  const primaryColor = tenant.theme_config?.primary_color || '#FB7701';
  const secondaryColor = tenant.theme_config?.secondary_color || '#111827';
  const themeTokens = useMemo(() => resolveStorefrontTokens(primaryColor, secondaryColor), [primaryColor, secondaryColor]);
  const themeStyles = useMemo(() => buildStorefrontThemeCSS(primaryColor, secondaryColor), [primaryColor, secondaryColor]);

  // Canales de Contacto & Redes Sociales Oficiales
  const aymePhoneFallback = tenant.slug === 'ayme-pet' ? '0998722324' : '';
  const social = (tenant.landing_config as any)?.social_links || (tenant.theme_config as any)?.social_links || {};
  const rawWhatsapp = social.whatsapp_main || selectedBranch?.phone_whatsapp || tenant.landing_config?.whatsapp_default || (tenant as any)?.phone_number || aymePhoneFallback;
  const { international: mainWhatsapp, display: displayPhone } = normalizeEcuadorPhone(rawWhatsapp);
  const defaultWelcomeMsg = social.whatsapp_welcome_msg || `¡Hola ${tenant.name}! Vengo desde su catálogo web oficial y deseo cotizar productos.`;

  const logoHeight = (tenant.theme_config as any)?.logo_height || 36;
  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);
  const showBestSellers =
    tenant.landing_config?.show_best_sellers ??
    (tenant.theme_config as any)?.show_best_sellers ??
    true;
  const showFeaturedRatings =
    tenant.landing_config?.show_featured_ratings ??
    (tenant.theme_config as any)?.show_featured_ratings ??
    true;

  const isBestSeller = (p: Product) => {
    const badge = p.attributes?.badge ? p.attributes.badge.toLowerCase() : '';
    if (badge.includes('vendido') || badge.includes('top') || badge.includes('estrella')) return true;
    const hash = (p.sku || p.id || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return hash % 3 === 0;
  };

  const isFiveStar = (p: Product) => {
    const hash = (p.id || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return hash % 2 === 0;
  };

  // Mapa O(1) de cantidad de productos por categoría (evita O(C x P) en loops)
  const categoryCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (p.category_id) {
        map.set(p.category_id, (map.get(p.category_id) || 0) + 1);
      }
    }
    return map;
  }, [products]);

  // Helper recursivo para obtener todos los IDs de una categoría y sus subcategorías con protección de ciclos
  const getCategoryAndDescendantIds = React.useCallback((catId: string): string[] => {
    const ids = [catId];
    const visited = new Set<string>([catId]);
    const findChildren = (pid: string, depth = 0) => {
      if (depth >= 5) return;
      for (const c of categories) {
        if (c.parent_id === pid && !visited.has(c.id)) {
          visited.add(c.id);
          ids.push(c.id);
          findChildren(c.id, depth + 1);
        }
      }
    };
    findChildren(catId);
    return ids;
  }, [categories]);

  // Conjunto Set O(1) de IDs de la categoría seleccionada y sus subcategorías (calculado una sola vez con useMemo)
  const selectedCategoryDescendantSet = useMemo(() => {
    if (selectedCategory === 'all' || selectedCategory === 'best_sellers' || selectedCategory === 'five_stars') {
      return null;
    }
    return new Set(getCategoryAndDescendantIds(selectedCategory));
  }, [selectedCategory, getCategoryAndDescendantIds]);

  // Filtrado y ordenamiento reactivo en vivo optimizado con useMemo en O(P log P)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'best_sellers'
          ? isBestSeller(p)
          : selectedCategory === 'five_stars'
          ? isFiveStar(p)
          : selectedCategoryDescendantSet
          ? selectedCategoryDescendantSet.has(p.category_id || '')
          : false;

      if (!matchesCategory) return false;

      if (!q) return true;

      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    });

    // Ordenamiento ágil estilo Temu
    return list.sort((a, b) => {
      if (sortBy === 'bestsellers') {
        const aTop = isBestSeller(a) ? 1 : 0;
        const bTop = isBestSeller(b) ? 1 : 0;
        if (bTop !== aTop) return bTop - aTop;
        return (b.name.length * 9 % 150) - (a.name.length * 9 % 150);
      }
      if (sortBy === 'min_qty_asc') {
        const aMin = a.min_order_qty || a.units_per_package || 100;
        const bMin = b.min_order_qty || b.units_per_package || 100;
        return aMin - bMin;
      }
      if (sortBy === 'rating') {
        const aStar = isFiveStar(a) ? 1 : 0;
        const bStar = isFiveStar(b) ? 1 : 0;
        return bStar - aStar;
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [products, selectedCategory, searchQuery, selectedCategoryDescendantSet, sortBy]);

  // Identificar la categoría raíz activa con protección contra ciclos
  const activeRootCategory = useMemo(() => {
    if (selectedCategory === 'all' || selectedCategory === 'best_sellers' || selectedCategory === 'five_stars') {
      return null;
    }
    const cat = categories.find((c) => c.id === selectedCategory);
    if (!cat) return null;
    if (!cat.parent_id) return cat;
    const visited = new Set<string>([cat.id]);
    let current = cat;
    let depth = 0;
    while (current.parent_id && depth < 5) {
      if (visited.has(current.parent_id)) break;
      const parent = categories.find((c) => c.id === current.parent_id);
      if (!parent) break;
      visited.add(parent.id);
      current = parent;
      depth++;
    }
    return current;
  }, [selectedCategory, categories]);

  // Categorías raíz (Nivel 1 sin parent_id)
  const rootCategories = useMemo(() => {
    return categories.filter((c) => !c.parent_id);
  }, [categories]);

  // Subcategorías de la raíz activa
  const availableSubcategories = useMemo(() => {
    if (!activeRootCategory) return [];
    return categories.filter((c) => c.parent_id === activeRootCategory.id);
  }, [activeRootCategory, categories]);

  // Subcategoría activa de nivel 2 (si la selección actual es nivel 2 o 3)
  const activeSubCategory = useMemo(() => {
    if (!activeRootCategory || selectedCategory === activeRootCategory.id) return null;
    const cat = categories.find((c) => c.id === selectedCategory);
    if (!cat) return null;
    if (cat.parent_id === activeRootCategory.id) return cat;
    const parent = categories.find((c) => c.id === cat.parent_id);
    if (parent && parent.parent_id === activeRootCategory.id) return parent;
    return null;
  }, [selectedCategory, activeRootCategory, categories]);

  // Tercer nivel disponible bajo la subcategoría activa
  const availableThirdLevel = useMemo(() => {
    if (!activeSubCategory) return [];
    return categories.filter((c) => c.parent_id === activeSubCategory.id);
  }, [activeSubCategory, categories]);

  const handleQuickAdd = (p: Product) => {
    const packSize = p.units_per_package || 1;
    const minQty = p.min_order_qty || packSize;
    const packs = Math.ceil(minQty / packSize);
    addItem(p, packs, 'Estándar');
    setJustAddedId(p.id);
    setJustAddedProductName(p.name);
    setTimeout(() => {
      setJustAddedId((curr) => (curr === p.id ? null : curr));
    }, 1800);
  };

  // VISTA PÁGINA COMPLETA DE PRODUCTO (CERO MODAL)
  if (modalProduct) {
    return (
      <ProductDetailView
        product={modalProduct}
        onBack={() => setModalProduct(null)}
        tenant={tenant}
        selectedBranch={selectedBranch}
        branches={branches}
        categories={categories}
      />
    );
  }

  return (
    <div
      style={themeStyles}
      className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-24 selection:bg-[var(--tenant-primary)] selection:text-[var(--tenant-primary-text)]"
    >
      {/* Drawer del Carrito Cotizador */}
      <CartDrawer
        tenant={tenant}
        branches={branches}
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
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
              <div
                className="w-auto rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 flex items-center justify-center shadow-2xs"
                style={{
                  height: `${logoHeight + 8}px`,
                  padding: '4px 8px',
                }}
              >
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  style={{ height: `${logoHeight}px` }}
                  className="w-auto object-contain"
                />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-base shadow-sm shrink-0"
                style={{ backgroundColor: themeTokens.primary, color: themeTokens.primaryText }}
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
              <div className="relative" ref={adminMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAdminMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-300 text-amber-900 transition-all cursor-pointer shadow-2xs"
                  title="Opciones de Administrador"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400 text-amber-700 flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-amber-800">Admin</span>
                  <ChevronDown className={`w-3 h-3 text-amber-600 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAdminMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl border bg-white border-slate-200 text-slate-800 p-2 shadow-2xl z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <span className="block text-xs font-bold text-slate-900 truncate">{tenant.name}</span>
                      <span className="block text-[10px] text-amber-600 font-mono">Sesión Administrador</span>
                    </div>

                    <Link
                      href={`/store/${tenant.slug}/admin`}
                      onClick={() => setIsAdminMenuOpen(false)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" style={{ color: themeTokens.primary }} />
                      <span>Volver a Mi Panel</span>
                    </Link>

                    <Link
                      href={`/store/${tenant.slug}/admin?tab=appearance`}
                      onClick={() => setIsAdminMenuOpen(false)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                      <span>Diseño & Apariencia</span>
                    </Link>

                    <Link
                      href={`/store/${tenant.slug}/admin?tab=products`}
                      onClick={() => setIsAdminMenuOpen(false)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      <Package className="w-4 h-4 text-amber-600" />
                      <span>Gestionar Productos</span>
                    </Link>

                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await fetch(`/api/admin/auth?shopSlug=${tenant.slug}`, { method: 'DELETE' });
                          } catch {
                            // Fallback
                          }
                          window.location.reload();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

            {/* Botón Carrito Cotizador Estilo Temu */}
            <button
              onClick={openCart}
              style={{ backgroundColor: themeTokens.secondary, color: themeTokens.secondaryText }}
              className="relative p-2 px-3 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer font-bold text-xs hover:brightness-110 active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Carrito</span>
              {totalCartUnits > 0 && (
                <span
                  style={{ backgroundColor: themeTokens.primary, color: themeTokens.primaryText }}
                  className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded-full shadow-2xs"
                >
                  {totalCartPackages}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Buscador Integrado Temu-Style con Botón de Búsqueda y Dropdown */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-2.5">
          <div ref={searchContainerRef} className="relative flex items-stretch">
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos, prendas, códigos SKU o colecciones..."
                className="w-full bg-slate-100 border border-slate-200 rounded-l-full sm:rounded-l-2xl pl-10 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[var(--tenant-primary)] focus:ring-1 focus:ring-[var(--tenant-primary)] focus:outline-none transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchDropdownOpen(false);
                  }}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsSearchDropdownOpen(false)}
              style={{ backgroundColor: themeTokens.primary, color: themeTokens.primaryText }}
              className="px-4 sm:px-6 rounded-r-full sm:rounded-r-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all hover:brightness-105 active:scale-98 shadow-xs cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5 hidden sm:inline" />
              <span>Buscar</span>
            </button>

            {/* Dropdown Flotante de Sugerencias y Selección de Categorías */}
            {isSearchDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* 1. Atajos Principales (Ofertas, Liquidación, Tendencias) */}
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                    <span>Popular ahora & Atajos</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('best_sellers');
                        setSearchQuery('');
                        setIsSearchDropdownOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Tendencias</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('oferta');
                        setSelectedCategory('all');
                        setIsSearchDropdownOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Tag className="w-3.5 h-3.5 text-rose-500" />
                      <span>Ofertas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('liquidacion');
                        setSelectedCategory('all');
                        setIsSearchDropdownOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
                      <span>Liquidación</span>
                    </button>

                    {showFeaturedRatings && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('five_stars');
                          setSearchQuery('');
                          setIsSearchDropdownOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>5 Estrellas</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Seleccionar por Categorías de la Tienda */}
                <div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" style={{ color: themeTokens.primary }} />
                      <span>Seleccionar Categoría</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {categories.length} categorías
                    </span>
                  </div>

                  {categories.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No hay categorías activas.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {/* Botón Ver Todo el Catálogo */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('all');
                          setSearchQuery('');
                          setIsSearchDropdownOpen(false);
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedCategory === 'all'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-800'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-xs block truncate">Todos los Productos</span>
                          <span className="text-[10px] opacity-75 font-mono block -mt-0.5">
                            {products.length} productos
                          </span>
                        </div>
                      </button>

                      {/* Lista de categorías organizadas jerárquicamente */}
                      {rootCategories.map((rc) => {
                        const count = getCategoryAndDescendantIds(rc.id).reduce(
                          (sum, id) => sum + (categoryCountMap.get(id) || 0),
                          0
                        );
                        const isSelected = selectedCategory === rc.id;
                        const subcats = categories.filter((c) => c.parent_id === rc.id);

                        return (
                          <div key={rc.id} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory(rc.id);
                                setSearchQuery('');
                                setIsSearchDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'font-bold'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-800'
                              }`}
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: themeTokens.primaryLight,
                                      borderColor: themeTokens.primaryBorder,
                                      color: themeTokens.primary,
                                    }
                                  : undefined
                              }
                            >
                              <div className="w-7 h-7 rounded-full overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center p-0.5">
                                {rc.image_url ? (
                                  <img
                                    src={rc.image_url}
                                    alt={rc.name}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <span className="font-extrabold text-[11px] text-slate-700">
                                    {rc.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-xs block truncate leading-tight">
                                  {rc.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {count} {count === 1 ? 'artículo' : 'artículos'}
                                </span>
                              </div>
                            </button>

                            {/* Subcategorías como chips en el dropdown */}
                            {subcats.length > 0 && (
                              <div className="flex flex-wrap gap-1 pl-4 pb-1">
                                {subcats.map((sub) => {
                                  const isSubSelected = selectedCategory === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedCategory(sub.id);
                                        setSearchQuery('');
                                        setIsSearchDropdownOpen(false);
                                      }}
                                      style={
                                        isSubSelected
                                          ? {
                                              backgroundColor: themeTokens.primary,
                                              borderColor: themeTokens.primary,
                                              color: themeTokens.primaryText,
                                            }
                                          : undefined
                                      }
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                                        isSubSelected
                                          ? 'font-bold'
                                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {sub.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
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
              style={
                isMegaMenuOpen
                  ? { backgroundColor: themeTokens.secondary, color: themeTokens.secondaryText }
                  : undefined
              }
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isMegaMenuOpen
                  ? 'shadow-xs'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5" style={{ color: isMegaMenuOpen ? themeTokens.secondaryText : themeTokens.primary }} />
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
              style={
                selectedCategory === 'all'
                  ? {
                      backgroundColor: themeTokens.primary,
                      color: themeTokens.primaryText,
                      boxShadow: `0 2px 8px ${themeTokens.primaryLight}`,
                    }
                  : undefined
              }
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              🔥 Todos los Productos
            </button>

            {showBestSellers && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('best_sellers');
                  setIsMegaMenuOpen(false);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'best_sellers'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${selectedCategory === 'best_sellers' ? 'text-white' : 'text-amber-500 fill-amber-500'}`} />
                <span>Más Vendidos</span>
              </button>
            )}

            {showFeaturedRatings && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('five_stars');
                  setIsMegaMenuOpen(false);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'five_stars'
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-extrabold'
                    : 'bg-amber-50/80 text-amber-900 border border-amber-200/80 hover:bg-amber-100'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${selectedCategory === 'five_stars' ? 'text-slate-950 fill-slate-950' : 'text-amber-500 fill-amber-500'}`} />
                <span>5 Estrellas</span>
              </button>
            )}

            {categories.filter((c) => !c.parent_id).map((c) => {
              const isSelected = selectedCategory === c.id || activeRootCategory?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c.id);
                    setIsMegaMenuOpen(false);
                  }}
                  style={
                    isSelected
                      ? {
                          backgroundColor: themeTokens.primary,
                          color: themeTokens.primaryText,
                          boxShadow: `0 2px 8px ${themeTokens.primaryLight}`,
                        }
                      : undefined
                  }
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'shadow-xs font-bold'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          {/* Sub-barra de Subcategorías (Nivel 2) */}
          {availableSubcategories.length > 0 && activeRootCategory && (
            <div className="flex items-center gap-1.5 pt-2 pb-1 overflow-x-auto text-xs border-t border-slate-100 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-0.5">
                <span>{activeRootCategory.name}</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
              </span>

              <button
                type="button"
                onClick={() => setSelectedCategory(activeRootCategory.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === activeRootCategory.id
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ver Todo {activeRootCategory.name}
              </button>

              {availableSubcategories.map((sub) => {
                const isSelected = selectedCategory === sub.id || activeSubCategory?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedCategory(sub.id)}
                    style={
                      isSelected
                        ? {
                            backgroundColor: themeTokens.primary,
                            color: themeTokens.primaryText,
                          }
                        : undefined
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'shadow-xs font-bold'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Sub-barra reactiva de 3er Nivel (Nivel 3) */}
          {availableThirdLevel.length > 0 && activeSubCategory && (
            <div
              style={{ backgroundColor: themeTokens.primaryLight }}
              className="flex items-center gap-1.5 pt-1.5 pb-1 overflow-x-auto text-[11px] border-t border-slate-100/80 scrollbar-none -mx-3 sm:-mx-6 px-3 sm:px-6"
            >
              <span
                style={{ color: themeTokens.primary }}
                className="text-[10px] font-extrabold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-0.5"
              >
                <CornerDownRight className="w-3 h-3" />
                <span>{activeSubCategory.name}</span>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </span>

              <button
                type="button"
                onClick={() => setSelectedCategory(activeSubCategory.id)}
                style={
                  selectedCategory === activeSubCategory.id
                    ? {
                        backgroundColor: themeTokens.primary,
                        color: themeTokens.primaryText,
                      }
                    : {
                        color: themeTokens.primary,
                        borderColor: themeTokens.primaryBorder,
                      }
                }
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer bg-white border shadow-2xs"
              >
                Todo en {activeSubCategory.name}
              </button>

              {availableThirdLevel.map((tl) => {
                const isSelected = selectedCategory === tl.id;
                return (
                  <button
                    key={tl.id}
                    type="button"
                    onClick={() => setSelectedCategory(tl.id)}
                    style={
                      isSelected
                        ? {
                            backgroundColor: themeTokens.secondary,
                            color: themeTokens.secondaryText,
                          }
                        : undefined
                    }
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'shadow-xs font-bold'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {tl.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              MEGA-MENÚ DESPLEGABLE CON 2 PANELES E IMÁGENES EN HOVER
              ========================================================================= */}
          {isMegaMenuOpen && (
            <div className="absolute left-0 right-0 top-full bg-white border-b border-slate-200 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
                {/* Cabecera del Mega Menú */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{
                        backgroundColor: themeTokens.primaryLight,
                        color: themeTokens.primary,
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs"
                    >
                      <Layers className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                        Explorar Categorías & Colecciones
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Navega por las colecciones principales y descubre todas las subcategorías con fotos.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMegaMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="Cerrar menú"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {rootCategories.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center italic">
                    No hay categorías activas en este momento.
                  </p>
                ) : (
                  <div className="flex flex-col md:flex-row gap-4 max-h-[70vh] overflow-hidden">
                    {/* PANEL IZQUIERDO: Categorías Principales (Nivel 1) */}
                    <div className="w-full md:w-72 shrink-0 overflow-y-auto pr-1 md:border-r border-slate-100 space-y-1 max-h-[28vh] md:max-h-[60vh] scrollbar-thin">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                        Categorías Principales
                      </div>
                      {rootCategories.map((root) => {
                        const isHovered = (hoveredMegaRootId || rootCategories[0]?.id) === root.id;
                        const rootCount = getCategoryAndDescendantIds(root.id).reduce(
                          (sum, id) => sum + (categoryCountMap.get(id) || 0),
                          0
                        );
                        const subCount = categories.filter((c) => c.parent_id === root.id).length;

                        return (
                          <button
                            key={root.id}
                            type="button"
                            onMouseEnter={() => setHoveredMegaRootId(root.id)}
                            onClick={() => {
                              setHoveredMegaRootId(root.id);
                              if (subCount === 0) {
                                setSelectedCategory(root.id);
                                setIsMegaMenuOpen(false);
                              }
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isHovered
                                ? 'font-bold shadow-2xs'
                                : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                            }`}
                            style={
                              isHovered
                                ? {
                                    backgroundColor: themeTokens.primaryLight,
                                    color: themeTokens.primary,
                                    border: `1px solid ${themeTokens.primaryBorder}`,
                                  }
                                : undefined
                            }
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {root.image_url ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 p-0.5 shadow-2xs">
                                  <img
                                    src={root.image_url}
                                    alt={root.name}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                </div>
                              ) : (
                                <span
                                  style={isHovered ? { backgroundColor: themeTokens.primaryLight, color: themeTokens.primary } : undefined}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isHovered ? '' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {root.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                              <div className="min-w-0">
                                <span className="text-xs truncate block">{root.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {subCount > 0 ? `${subCount} subcategorías` : `${rootCount} productos`}
                                </span>
                              </div>
                            </div>

                            <ChevronRight
                              style={isHovered ? { color: themeTokens.primary } : undefined}
                              className={`w-4 h-4 shrink-0 transition-transform ${
                                isHovered ? 'translate-x-0.5' : 'text-slate-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* PANEL DERECHO: Subcategorías (Nivel 2) y 3er Nivel (Nivel 3) */}
                    {(() => {
                      const activeRoot = rootCategories.find(
                        (r) => r.id === (hoveredMegaRootId || rootCategories[0]?.id)
                      ) || rootCategories[0];

                      if (!activeRoot) return null;

                      const subcats = categories.filter((c) => c.parent_id === activeRoot.id);
                      const totalRootProducts = getCategoryAndDescendantIds(activeRoot.id).reduce(
                        (sum, id) => sum + (categoryCountMap.get(id) || 0),
                        0
                      );

                      return (
                        <div className="flex-1 overflow-y-auto pl-0 md:pl-3 max-h-[42vh] md:max-h-[60vh] space-y-4">
                          {/* Banner de la categoría principal activa */}
                          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {activeRoot.image_url && (
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white p-0.5 shrink-0 shadow-2xs">
                                  <img
                                    src={activeRoot.image_url}
                                    alt={activeRoot.name}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                </div>
                              )}
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900">{activeRoot.name}</h4>
                                <p className="text-[11px] text-slate-500">
                                  {totalRootProducts} prendas disponibles en esta colección
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory(activeRoot.id);
                                setIsMegaMenuOpen(false);
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <span>Ver Todo en {activeRoot.name}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Subcategorías de Nivel 2 */}
                          {subcats.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                              <p className="text-xs text-slate-600 font-semibold">
                                Esta colección no tiene subcategorías divididas.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(activeRoot.id);
                                  setIsMegaMenuOpen(false);
                                }}
                                style={{ color: themeTokens.primary }}
                                className="text-xs font-bold underline cursor-pointer hover:brightness-90"
                              >
                                Ver todos los productos de {activeRoot.name}
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {subcats.map((sub) => {
                                const subProductsCount = getCategoryAndDescendantIds(sub.id).reduce(
                                  (sum, id) => sum + (categoryCountMap.get(id) || 0),
                                  0
                                );
                                const thirdLevels = categories.filter((c) => c.parent_id === sub.id);

                                return (
                                  <div
                                    key={sub.id}
                                    className="bg-white border border-slate-200/90 rounded-2xl p-3 hover:shadow-xs transition-all space-y-2.5 flex flex-col justify-between"
                                  >
                                    <div>
                                      {/* Cabecera de Subcategoría (Nivel 2) */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedCategory(sub.id);
                                          setIsMegaMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2.5 text-left group cursor-pointer"
                                      >
                                        {sub.image_url ? (
                                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 p-0.5 group-hover:scale-105 transition-transform shadow-2xs">
                                            <img
                                              src={sub.image_url}
                                              alt={sub.name}
                                              className="w-full h-full object-cover rounded-full"
                                            />
                                          </div>
                                        ) : (
                                          <span
                                            style={{
                                              backgroundColor: themeTokens.primaryLight,
                                              borderColor: themeTokens.primaryBorder,
                                              color: themeTokens.primary,
                                            }}
                                            className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 transition-colors"
                                          >
                                            {sub.name.charAt(0).toUpperCase()}
                                          </span>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <span className="font-extrabold text-xs text-slate-800 transition-colors block truncate">
                                            {sub.name}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-mono block -mt-0.5">
                                            {subProductsCount} {subProductsCount === 1 ? 'producto' : 'productos'}
                                          </span>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />
                                      </button>

                                      {/* Chips de 3er Nivel */}
                                      {thirdLevels.length > 0 && (
                                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                                          {thirdLevels.map((tl) => (
                                            <button
                                              key={tl.id}
                                              type="button"
                                              onClick={() => {
                                                setSelectedCategory(tl.id);
                                                setIsMegaMenuOpen(false);
                                              }}
                                              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70 rounded-md text-[10px] font-medium transition-colors cursor-pointer"
                                            >
                                              {tl.name}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Banner Informativo Rápido Estilo Temu */}
      <div
        style={{
          backgroundColor: themeTokens.secondary,
          color: themeTokens.secondaryText,
        }}
        className="text-[11px] font-medium py-1.5 px-4 text-center border-b border-black/10"
      >
        <span>📦 Pedidos y cotizaciones directas a fábrica por bulto, fardo o pallet con despacho nacional</span>
      </div>

      {/* =========================================================================
          3. GRILLA DENSA DE PRODUCTOS (2 COLUMNAS EN MÓVIL)
          ========================================================================= */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-6 py-4">
        {/* =========================================================================
            HERO PROMO BANNER TEMU-STYLE (VENTA DIRECTA DE FÁBRICA)
            ========================================================================= */}
        <section
          style={{
            background: `linear-gradient(135deg, ${themeTokens.primary} 0%, ${themeTokens.secondary} 100%)`,
          }}
          className="mb-4 rounded-3xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden animate-fade-in border border-white/10"
        >
          {/* Formas geométricas difusas de fondo */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute right-1/4 -top-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-white/20 backdrop-blur-md text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                  <Flame className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  <span>Venta Mayorista Directa</span>
                </span>
                <span className="bg-black/25 backdrop-blur-md text-white/90 text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-yellow-300" />
                  <span>Despachos del día hasta las 14:00</span>
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-tight">
                Precios de Fábrica por Fardo, Bulto & Pallet
              </h2>

              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                Abastece tu negocio directamente con {tenant.name}. Precios escalonados por volumen, catálogo con stock real y confirmación inmediata por WhatsApp.
              </p>

              {/* Sellos de Confianza Rápidos */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-white/90 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Calidad Garantizada</span>
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-sky-200" />
                  <span>Empaque Industrial Protegido</span>
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-amber-200" />
                  <span>Cobertura a Todo el País</span>
                </span>
              </div>
            </div>

            {/* Micro-callout con botón WhatsApp rápido */}
            {mainWhatsapp && (
              <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/15">
                <div className="text-left sm:text-right">
                  <span className="block text-[10px] uppercase font-bold text-white/70">Atención Personalizada</span>
                  <span className="font-extrabold text-sm text-white font-mono">{displayPhone || 'WhatsApp Directo'}</span>
                </div>
                <a
                  href={buildEcuadorWhatsAppUrl(mainWhatsapp, defaultWelcomeMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Hablar con un Asesor</span>
                </a>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            BARRA DE COLECCIONES CON FOTOS CIRCULARES
            ========================================================================= */}
        {categories.length > 0 && (
          <div className="mb-4 bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: themeTokens.primary }}
                />
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
                  style={{
                    color: themeTokens.primary,
                    backgroundColor: themeTokens.primaryLight,
                  }}
                  className="text-[11px] font-bold cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors hover:brightness-95"
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

              {/* Botón circular "Más Vendidos" si está habilitado */}
              {showBestSellers && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('best_sellers');
                    setIsMegaMenuOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 shrink-0 w-16 sm:w-20 group cursor-pointer transition-all ${
                    selectedCategory === 'best_sellers' ? 'scale-105' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all p-0.5 shadow-xs ${
                      selectedCategory === 'best_sellers'
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white ring-2 ring-amber-500 ring-offset-2'
                        : 'bg-amber-50 text-amber-700 border-2 border-amber-200 group-hover:border-amber-400'
                    }`}
                  >
                    <Flame className={`w-6 h-6 ${selectedCategory === 'best_sellers' ? 'text-white' : 'text-amber-500'}`} />
                  </div>
                  <span
                    className={`text-[11px] font-bold text-center line-clamp-1 leading-tight ${
                      selectedCategory === 'best_sellers' ? 'text-amber-800' : 'text-slate-600'
                    }`}
                  >
                    Top Ventas
                  </span>
                  <span className="text-[9px] text-amber-600 font-mono -mt-1">
                    Favoritos
                  </span>
                </button>
              )}

              {/* Botón circular "5 Estrellas" si está habilitado */}
              {showFeaturedRatings && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('five_stars');
                    setIsMegaMenuOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 shrink-0 w-16 sm:w-20 group cursor-pointer transition-all ${
                    selectedCategory === 'five_stars' ? 'scale-105' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all p-0.5 shadow-xs ${
                      selectedCategory === 'five_stars'
                        ? 'bg-gradient-to-tr from-amber-400 to-yellow-400 text-slate-950 ring-2 ring-amber-400 ring-offset-2'
                        : 'bg-amber-50 text-amber-700 border-2 border-amber-200 group-hover:border-amber-400'
                    }`}
                  >
                    <Star className={`w-6 h-6 ${selectedCategory === 'five_stars' ? 'text-slate-950 fill-slate-950' : 'text-amber-500 fill-amber-500'}`} />
                  </div>
                  <span
                    className={`text-[11px] font-bold text-center line-clamp-1 leading-tight ${
                      selectedCategory === 'five_stars' ? 'text-amber-900 font-extrabold' : 'text-slate-600'
                    }`}
                  >
                    5 Estrellas
                  </span>
                  <span className="text-[9px] text-amber-700 font-mono -mt-1">
                    Calificadas
                  </span>
                </button>
              )}

              {/* Categorías con fotos circulares */}
              {(activeRootCategory && availableSubcategories.length > 0
                ? availableSubcategories
                : rootCategories
              ).map((c) => {
                const count = getCategoryAndDescendantIds(c.id).reduce(
                  (sum, id) => sum + (categoryCountMap.get(id) || 0),
                  0
                );
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
                      style={
                        isSelected
                          ? {
                              backgroundColor: themeTokens.primaryLight,
                              borderColor: themeTokens.primary,
                              boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${themeTokens.primary}`,
                            }
                          : undefined
                      }
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden transition-all p-0.5 flex items-center justify-center shadow-xs ${
                        isSelected
                          ? 'border-2'
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
                      style={isSelected ? { color: themeTokens.primary } : undefined}
                      className={`text-[11px] font-semibold text-center line-clamp-2 leading-tight w-full ${
                        isSelected ? 'font-extrabold' : 'text-slate-700'
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

        {/* Indicador de Más Vendidos */}
        {selectedCategory === 'best_sellers' && (
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-3.5 py-2.5 mb-3.5 shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-extrabold text-amber-950">
                🔥 Artículos Más Vendidos • <span className="font-semibold text-amber-800">Prendas favoritas de nuestros clientes</span>
              </span>
              <span className="text-[10px] text-amber-700 font-mono bg-white/80 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'prenda' : 'prendas'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs transition-colors shrink-0"
            >
              <span>Ver catálogo completo</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Indicador de 5 Estrellas */}
        {selectedCategory === 'five_stars' && (
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 mb-3.5 shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-extrabold text-amber-950">
                ⭐ Colección 5 Estrellas • <span className="font-semibold text-amber-800">Prendas con máxima satisfacción de nuestros compradores</span>
              </span>
              <span className="text-[10px] text-amber-800 font-mono bg-white/90 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'prenda' : 'prendas'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs transition-colors shrink-0"
            >
              <span>Ver catálogo completo</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {selectedCategory !== 'all' && activeCategoryObj && (
          <div
            style={{
              backgroundColor: themeTokens.primaryLight,
              borderColor: themeTokens.primaryBorder,
            }}
            className="flex items-center justify-between border rounded-xl px-3 py-2 mb-3 shadow-2xs animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: themeTokens.primary }}
              />
              <span className="text-xs font-bold text-slate-900">
                Colección: <span style={{ color: themeTokens.primary }}>{activeCategoryObj.name}</span>
              </span>
              <span
                style={{
                  color: themeTokens.primary,
                  borderColor: themeTokens.primaryBorder,
                }}
                className="text-[10px] font-mono bg-white border px-1.5 py-0.5 rounded-md font-bold shadow-2xs"
              >
                {filteredProducts.length} {filteredProducts.length === 1 ? 'artículo' : 'artículos'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              style={{ color: themeTokens.primary }}
              className="text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs transition-colors"
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
          <>
            {/* =========================================================================
                BARRA DE ORDENAMIENTO Y FILTROS TEMU (SORTING BAR)
                ========================================================================= */}
            <div className="flex items-center justify-between gap-2 mb-3 px-1 overflow-x-auto scrollbar-none py-1 border-b border-slate-200/70">
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span className="hidden sm:inline">Ordenar:</span>
                </span>

                <button
                  type="button"
                  onClick={() => setSortBy('recommended')}
                  style={
                    sortBy === 'recommended'
                      ? {
                          backgroundColor: themeTokens.primaryLight,
                          borderColor: themeTokens.primaryBorder,
                          color: themeTokens.primary,
                        }
                      : undefined
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    sortBy === 'recommended'
                      ? 'shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Recomendados
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('bestsellers')}
                  style={
                    sortBy === 'bestsellers'
                      ? {
                          backgroundColor: themeTokens.primaryLight,
                          borderColor: themeTokens.primaryBorder,
                          color: themeTokens.primary,
                        }
                      : undefined
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                    sortBy === 'bestsellers'
                      ? 'shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Más Vendidos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('min_qty_asc')}
                  style={
                    sortBy === 'min_qty_asc'
                      ? {
                          backgroundColor: themeTokens.primaryLight,
                          borderColor: themeTokens.primaryBorder,
                          color: themeTokens.primary,
                        }
                      : undefined
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    sortBy === 'min_qty_asc'
                      ? 'shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Menor Volumen
                </button>

                {showFeaturedRatings && (
                  <button
                    type="button"
                    onClick={() => setSortBy('rating')}
                    style={
                      sortBy === 'rating'
                        ? {
                            backgroundColor: themeTokens.primaryLight,
                            borderColor: themeTokens.primaryBorder,
                            color: themeTokens.primary,
                          }
                        : undefined
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                      sortBy === 'rating'
                        ? 'shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Mejor Calificados</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] font-mono text-slate-400 shrink-0 hidden sm:block">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'artículo' : 'artículos'}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
            {filteredProducts.slice(0, visibleCount).map((p) => {
              const packSize = p.units_per_package || 100;
              const minQty = p.min_order_qty || packSize;
              const imageSrc = getProductPrimaryImage(p.images, tenant);
              const productHref = `/store/${tenant.slug}/producto/${encodeURIComponent(p.slug || p.sku?.toLowerCase() || p.id)}`;

              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all group"
                >
                  {/* Foto con Badges y Logo de Tienda */}
                  <Link
                    href={productHref}
                    className={`relative bg-slate-50 flex items-center justify-center p-2 cursor-pointer overflow-hidden block ${
                      p.attributes?.aspect_ratio === 'square' ? 'aspect-square' : 'aspect-[3/4]'
                    }`}
                  >
                    <img
                      src={imageSrc}
                      alt={p.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Logo de la Empresa en la esquina de la foto */}
                    {tenant.logo_url && (
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-lg overflow-hidden bg-white/95 p-0.5 border border-slate-200/80 shadow-xs backdrop-blur-xs flex items-center justify-center z-10">
                        <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-contain" />
                      </div>
                    )}

                    {/* Badge Top Ventas si está habilitado */}
                    {showBestSellers && isBestSeller(p) ? (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs z-10 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-yellow-200 fill-yellow-200" />
                        <span>Top Ventas</span>
                      </div>
                    ) : (
                      /* Badge MOQ / Volumen con Color Secundario */
                      <div
                        style={{
                          backgroundColor: themeTokens.secondary,
                          color: themeTokens.secondaryText,
                        }}
                        className="absolute top-2 left-2 font-mono text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs z-10 shadow-xs"
                      >
                        Mín: {minQty.toLocaleString()} uds
                      </div>
                    )}

                    {p.sku && (
                      <div className="absolute bottom-2 left-2 bg-slate-900/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs z-10">
                        CÓD: {p.sku}
                      </div>
                    )}
                  </Link>

                  {/* Datos del Producto */}
                  <div className="p-2.5 sm:p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h3
                        className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2 cursor-pointer"
                        title={p.name}
                      >
                        <Link href={productHref} className="hover:underline">
                          {p.name}
                        </Link>
                      </h3>

                      {/* Tallas y Colores en la Tarjeta */}
                      {(p.attributes?.specs?.tallas || p.attributes?.specs?.color) && (
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {p.attributes?.specs?.color && (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium truncate max-w-[130px]">
                              🎨 {p.attributes.specs.color}
                            </span>
                          )}
                          {p.attributes?.specs?.tallas && (
                            <span
                              style={{
                                backgroundColor: themeTokens.primaryLight,
                                color: themeTokens.primary,
                                borderColor: themeTokens.primaryBorder,
                              }}
                              className="border px-1.5 py-0.5 rounded font-mono font-bold"
                            >
                              📏 {p.attributes.specs.tallas}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Calificación y Prueba Social de Demanda */}
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                        <div className="flex items-center gap-1">
                          <div className="flex items-center text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <Star className="w-3 h-3 fill-amber-400" />
                            <Star className="w-3 h-3 fill-amber-400" />
                            <Star className="w-3 h-3 fill-amber-400" />
                            <Star className="w-3 h-3 fill-amber-400" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 font-mono">5.0</span>
                        </div>
                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                          <span>🔥</span>
                          <span className="font-semibold text-slate-700 font-mono">+{(p.name.length * 9) % 150 + 20}</span>
                          <span className="text-slate-400">pedidos</span>
                        </span>
                      </div>

                      {/* Badge Vendedor Estrella */}
                      <div className="pt-0.5">
                        <span className="bg-slate-900 text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
                          <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                          <span>Vendedor Estrella</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100/80">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Fardo x {packSize} uds</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-700">
                          Mín: {minQty.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Botones de Acción: Ficha Técnica y Carrito Cotizador Estilo Temu */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <button
                        onClick={() => setModalProduct(p)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] py-1.5 px-2 rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Ficha
                      </button>
                      <button
                        onClick={() => handleQuickAdd(p)}
                        style={
                          justAddedId === p.id
                            ? {
                                backgroundColor: '#10B981',
                                color: '#ffffff',
                              }
                            : {
                                backgroundColor: themeTokens.primary,
                                color: themeTokens.primaryText,
                              }
                        }
                        className={`font-bold text-[11px] py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 ${
                          justAddedId === p.id ? 'scale-105' : 'hover:brightness-110'
                        }`}
                        title="Agregar fardo al cotizador"
                      >
                        {justAddedId === p.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>¡Agregado!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Cotizar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

            {/* Botón de Carga Progresiva / Lazy Loading */}
            {filteredProducts.length > visibleCount && (
              <div className="text-center py-6 mt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                  className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-full border border-slate-200 shadow-xs cursor-pointer transition-all hover:scale-105"
                >
                  Cargar más productos (Mostrando {visibleCount} de {filteredProducts.length})
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* =========================================================================
          4. BARRA FLOTANTE INFERIOR DE CARRITO / WHATSAPP PARA MÓVIL
          ========================================================================= */}
      {totalCartUnits > 0 && (
        <div className="fixed bottom-4 inset-x-3 z-40 max-w-md mx-auto animate-fade-in">
          <div
            onClick={openCart}
            style={{
              backgroundColor: themeTokens.secondary,
              color: themeTokens.secondaryText,
            }}
            className="p-3.5 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer border border-white/10 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: themeTokens.primary,
                  color: themeTokens.primaryText,
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-xs shrink-0"
              >
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold">Cotizador Listo</div>
                <div className="text-[11px] opacity-80 font-mono">
                  {totalCartUnits.toLocaleString()} unidades ({totalCartPackages} bultos)
                </div>
              </div>
            </div>

            <button
              style={{
                backgroundColor: themeTokens.primary,
                color: themeTokens.primaryText,
              }}
              className="font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-xs hover:brightness-105 active:scale-95 transition-all"
            >
              <span>Ver Pedido</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Toast Flotante de Confirmación Temu-Style */}
      {justAddedId && (
        <div className="fixed top-20 inset-x-4 z-50 max-w-sm mx-auto animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none">
          <div className="bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3 pointer-events-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Check className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate">¡Agregado al Cotizador!</p>
                <p className="text-[10px] text-slate-300 truncate">{justAddedProductName}</p>
              </div>
            </div>
            <button
              onClick={openCart}
              style={{ backgroundColor: themeTokens.primary, color: themeTokens.primaryText }}
              className="text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer hover:brightness-110 shrink-0"
            >
              Ver Carrito
            </button>
          </div>
        </div>
      )}

      {/* Footer Minimalista */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400 space-y-2">
        <p>© {new Date().getFullYear()} {tenant.name} — Plataforma B2B impulsada por tenddy.</p>
        <div className="flex justify-center">
          <VersionBadge className="bg-slate-50 border-slate-200 text-slate-500" />
        </div>
      </footer>

      {/* Botón Flotante de WhatsApp Comercial (Ecuador) - Ubicado a la derecha */}
      {social.show_floating_whatsapp !== false && (
        <aside
          aria-label="Atención por WhatsApp"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 sm:gap-3 group animate-fade-in"
        >
          <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl pointer-events-none whitespace-nowrap">
            ¿Cotizamos por WhatsApp? 💬
          </div>
          <a
            href={buildEcuadorWhatsAppUrl(mainWhatsapp, defaultWelcomeMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/40 hover:scale-108 transition-all active:scale-95 cursor-pointer relative"
            title={`Chatear por WhatsApp con ${tenant.name} (${displayPhone})`}
          >
            <span className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-emerald-300 absolute -top-0.5 -right-0.5 animate-ping opacity-75" />
            <span className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 border-2 border-white" />
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          </a>
        </aside>
      )}
    </div>
  );
}
