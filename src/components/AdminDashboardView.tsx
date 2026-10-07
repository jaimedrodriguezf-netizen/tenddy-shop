'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Calendar,
  ExternalLink,
  Search,
  Plus,
  Trash2,
  LayoutDashboard,
  Boxes,
  Paintbrush,
  LogOut,
  Store,
  ArrowUpRight,
  Users,
  Eye,
  Menu,
  X,
  MapPin,
  LifeBuoy,
  Tag,
  FileSpreadsheet,
  Edit2,
  TrendingUp,
  MessageCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  Layers,
  Check,
  Bell,
  Star,
  Award,
  SlidersHorizontal
} from 'lucide-react';
import { Tenant, Branch, Product, Category } from '@/lib/types';
import CreateProductModal from './CreateProductModal';
import EditProductModal from './EditProductModal';
import BulkImportModal from './BulkImportModal';
import AppearanceTab from './AppearanceTab';
import TeamTab, { TenantMember } from './TeamTab';
import TenantSupportCenterModal from './TenantSupportCenterModal';
import CategoriesManagerView from './CategoriesManagerView';
import ProductsManagerView from './ProductsManagerView';
import VersionBadge from './VersionBadge';

interface QuoteItem {
  product_id: string;
  name: string;
  sku: string;
  package_count: number;
  units_per_package: number;
  total_units: number;
  selected_color?: string;
  specs?: Record<string, string>;
}

export interface QuoteRecord {
  id: string;
  quote_number: string;
  customer_name: string;
  company_name?: string;
  tax_id?: string;
  customer_phone: string;
  customer_email?: string;
  delivery_city?: string;
  delivery_address?: string;
  notes?: string;
  status: 'pending' | 'contacted' | 'approved' | 'rejected';
  items: QuoteItem[];
  created_at: string;
  branch_id?: string;
}

interface AdminDashboardViewProps {
  tenant: Tenant;
  branches: Branch[];
  products: Product[];
  categories?: Category[];
  initialQuotes: QuoteRecord[];
  initialMembers?: TenantMember[];
}

export default function AdminDashboardView({
  tenant: initialTenant,
  branches,
  products: initialProducts,
  categories: initialCategories = [],
  initialQuotes,
  initialMembers = [],
}: AdminDashboardViewProps) {
  const [tenant, setTenant] = useState<Tenant>(initialTenant);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quotes' | 'products' | 'categories' | 'team' | 'appearance'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'dashboard' || tabParam === 'products' || tabParam === 'quotes' || tabParam === 'categories' || tabParam === 'team' || tabParam === 'appearance') {
        return tabParam as any;
      }
    }
    return 'dashboard';
  });
  const [quotes, setQuotes] = useState<QuoteRecord[]>(initialQuotes);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(quotes[0] || null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportModalInitialTab, setSupportModalInitialTab] = useState<'tickets' | 'new' | 'fixes'>('tickets');
  const [unreadSupportCount, setUnreadSupportCount] = useState<number>(0);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(true);
  const [isQuotesOpen, setIsQuotesOpen] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productCategorySearch, setProductCategorySearch] = useState('');
  const [isProductCatOpen, setIsProductCatOpen] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [productsPage, setProductsPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(15);

  // Mapa O(1) de productos por categoría para evitar loops O(C x P)
  const categoryCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (p.category_id) {
        map.set(p.category_id, (map.get(p.category_id) || 0) + 1);
      }
    }
    return map;
  }, [products]);

  const [prevProductFilters, setPrevProductFilters] = useState({
    search: productSearch,
    category: productCategoryFilter,
  });

  if (
    prevProductFilters.search !== productSearch ||
    prevProductFilters.category !== productCategoryFilter
  ) {
    setPrevProductFilters({
      search: productSearch,
      category: productCategoryFilter,
    });
    setProductsPage(1);
  }

  // Consultar notificaciones de soporte no leídas
  useEffect(() => {
    async function checkSupportNotifications() {
      try {
        const res = await fetch(`/api/admin/support?tenantId=${tenant.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.totalUnread !== undefined) {
          setUnreadSupportCount(data.totalUnread);
        }
      } catch {
        // Silencioso en caso de fallo de red
      }
    }
    if (tenant.id) {
      checkSupportNotifications();
    }
  }, [tenant.id]);
  // Métricas
  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter((q) => q.status === 'pending').length;
  const approvedQuotes = quotes.filter((q) => q.status === 'approved').length;
  const totalUnitsQuoted = quotes.reduce((acc, q) => {
    return acc + (q.items?.reduce((sub, item) => sub + (item.total_units || 0), 0) || 0);
  }, 0);
  const viewsCount = tenant.views_count || 0;

  // Filtrado de cotizaciones
  const filteredQuotes = quotes.filter((q) => {
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    const matchesSearch =
      q.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.company_name && q.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      q.customer_phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = async (quoteId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/quotes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quoteId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.quote) {
        setQuotes((prev) =>
          prev.map((item) => (item.id === quoteId ? { ...item, status: newStatus as any } : item))
        );
        if (selectedQuote?.id === quoteId) {
          setSelectedQuote((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        }
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto del catálogo?')) return;
    try {
      const res = await fetch(`/api/admin/products?productId=${productId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (e) {
      console.error('Error borrando producto:', e);
    }
  };

  const handleLogout = async () => {
    await fetch(`/api/admin/auth?shopSlug=${tenant.slug}`, { method: 'DELETE' });
    window.location.reload();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pendiente
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Contactado
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Aprobado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Descartado
          </span>
        );
      default:
        return null;
    }
  };

  // Componente de navegación reutilizable para Sidebar Desktop y Drawer Móvil
  const renderNavItems = () => (
    <div className="space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
        Gestión Principal
      </span>

      {/* 1. DASHBOARD */}
      <button
        onClick={() => {
          setActiveTab('dashboard');
          setIsMobileSidebarOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          activeTab === 'dashboard'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-4 h-4 text-sky-500" />
          <span>Dashboard</span>
        </div>
      </button>

      {/* 2. PRODUCTOS (SUBMENÚ ANIDADO) */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => setIsProductsMenuOpen(!isProductsMenuOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'products' || activeTab === 'categories'
              ? 'text-slate-900 bg-slate-100/90 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Package className="w-4 h-4 text-sky-600" />
            <span>Productos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold bg-slate-200/80 text-slate-600">
              {products.length}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isProductsMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Submenú desplegable anidado */}
        {isProductsMenuOpen && (
          <div className="ml-4 pl-3 border-l-2 border-slate-100 space-y-1 py-1">
            {/* 1. Todos los productos */}
            <button
              onClick={() => {
                setActiveTab('products');
                setIsCreateModalOpen(false);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                activeTab === 'products' && !isCreateModalOpen
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Todos los productos</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeTab === 'products' && !isCreateModalOpen
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {products.length}
              </span>
            </button>

            {/* 2. Añadir un nuevo producto */}
            <button
              onClick={() => {
                setActiveTab('products');
                setIsCreateModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                activeTab === 'products' && isCreateModalOpen
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-3 h-3 text-sky-500" />
              <span>Añadir un nuevo producto</span>
            </button>

            {/* 3. Marcas */}
            <button
              onClick={() => {
                setActiveTab('products');
                setIsCreateModalOpen(false);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Marcas</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400">1</span>
            </button>

            {/* 4. Categorías */}
            <button
              onClick={() => {
                setActiveTab('categories');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sky-600" />
                <span>Categorías</span>
              </div>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeTab === 'categories'
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {categories.length}
              </span>
            </button>

            {/* 5. Etiquetas */}
            <button
              onClick={() => {
                setActiveTab('products');
                setIsCreateModalOpen(false);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Etiquetas</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400">Tags</span>
            </button>

            {/* 6. Atributos (Tallas & Colores) */}
            <button
              onClick={() => {
                setActiveTab('products');
                setIsCreateModalOpen(false);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                <span>Atributos</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">Variantes</span>
            </button>

            {/* 7. Valoraciones */}
            <button
              onClick={() => {
                setActiveTab('appearance');
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Valoraciones</span>
              </div>
              <span className="text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded">5.0</span>
            </button>

            {/* 8. Carga Masiva (Excel) */}
            <button
              onClick={() => {
                setIsBulkModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              title="Cargar catálogo masivo con plantilla Excel oficial (.xlsx)"
            >
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Importar Excel</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 3. COTIZACIONES & PEDIDOS (ACORDEÓN DESPLEGABLE HACIA ABAJO - TICKET #2849) */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => setIsQuotesOpen(!isQuotesOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'quotes'
              ? 'text-slate-900 bg-slate-100/90 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <MessageCircle className="w-4 h-4 text-slate-500" />
            <span>Cotizaciones & Pedidos</span>
          </div>
          <div className="flex items-center gap-1.5">
            {pendingQuotes > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                pendingQuotes > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {quotes.length}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isQuotesOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Submenú desplegable de Cotizaciones & Pedidos */}
        {isQuotesOpen && (
          <div className="ml-4 pl-3 border-l-2 border-slate-100 space-y-1 py-1">
            <button
              onClick={() => {
                setActiveTab('quotes');
                setFilterStatus('all');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                activeTab === 'quotes' && filterStatus === 'all'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Todas las Solicitudes</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeTab === 'quotes' && filterStatus === 'all'
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {quotes.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('quotes');
                setFilterStatus('pending');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                activeTab === 'quotes' && filterStatus === 'pending'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Por Atender</span>
              </div>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'quotes' && filterStatus === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {pendingQuotes}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('quotes');
                setFilterStatus('approved');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                activeTab === 'quotes' && filterStatus === 'approved'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Aprobadas / Cerradas</span>
              </div>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeTab === 'quotes' && filterStatus === 'approved'
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {approvedQuotes}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 4. DISEÑO & APARIENCIA */}
      <button
        onClick={() => {
          setActiveTab('appearance');
          setIsMobileSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          activeTab === 'appearance'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Paintbrush className="w-4 h-4 text-purple-500" />
        <span>Diseño & Apariencia</span>
      </button>

      {/* 5. CONFIGURACIÓN & PERFIL (REUBICACIÓN DE EQUIPO Y ROLES - TICKET #3737) */}
      <div className="pt-3 border-t border-slate-100 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
          Perfil & Configuración
        </span>

        <button
          onClick={() => {
            setActiveTab('team');
            setIsMobileSidebarOpen(false);
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'team'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-sky-600" />
            <span>Perfil & Roles de Equipo</span>
          </div>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === 'team' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {initialMembers.length || 1}
          </span>
        </button>
      </div>

      {/* 6. ASISTENCIA & SOPORTE */}
      <div className="pt-3 border-t border-slate-100 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
          Asistencia & Tienda
        </span>

        <button
          onClick={() => {
            setSupportModalInitialTab('tickets');
            setIsSupportModalOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LifeBuoy className="w-4 h-4 text-amber-500" />
            <span>Mesa de Ayuda & Soporte</span>
          </div>
          {unreadSupportCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full animate-pulse">
              {unreadSupportCount}
            </span>
          )}
        </button>

        <Link
          href={`/store/${tenant.slug}`}
          target="_blank"
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Store className="w-4 h-4 text-slate-400" />
            <span>Ver Tienda Pública</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex antialiased">
      {/* Modal de Centro de Soporte, Hilos y Fixes */}
      <TenantSupportCenterModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        tenantId={tenant.id}
        shopName={tenant.name}
        defaultName={initialMembers[0]?.full_name || tenant.name}
        defaultPhone={tenant.landing_config?.whatsapp_default || branches[0]?.phone_whatsapp || initialMembers[0]?.phone || ''}
        defaultEmail={initialMembers[0]?.email || tenant.landing_config?.email || ''}
        initialTab={supportModalInitialTab}
        onNotificationRead={() => setUnreadSupportCount((prev) => Math.max(0, prev - 1))}
      />

      {/* =========================================================================
          1. MENÚ LATERAL DRAWER MÓVIL (Slide-over)
          ========================================================================= */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col justify-between z-10 shadow-2xl">
            <div className="p-5 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white shadow-sm text-sm shrink-0">
                    {tenant.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-slate-900 truncate">
                      {tenant.name}
                    </h2>
                    <span className="text-[10px] text-slate-500 font-mono block truncate">
                      {tenant.slug}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderNavItems()}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex justify-center">
                <VersionBadge />
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* =========================================================================
          2. MENÚ LATERAL DESKTOP (SIDEBAR)
          ========================================================================= */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/80 flex-col justify-between shrink-0 sticky top-0 h-screen z-30 shadow-sm">
        <div className="p-5 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white shadow-sm text-sm shrink-0">
              {tenant.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900 truncate tracking-tight">
                {tenant.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
                  {tenant.slug}
                </span>
              </div>
            </div>
          </div>

          {renderNavItems()}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex justify-center">
            <VersionBadge />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          3. ÁREA DE CONTENIDO PRINCIPAL
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200/80 px-3 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Botón Menú Móvil */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="text-xs sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {activeTab === 'dashboard' && 'Dashboard • Resumen de Negocio'}
              {activeTab === 'quotes' && 'Cotizaciones & Pedidos'}
              {activeTab === 'products' && 'Productos'}
              {activeTab === 'categories' && 'Gestión de Categorías B2B'}
              {activeTab === 'team' && 'Equipo & Asesores'}
              {activeTab === 'appearance' && 'Diseño & Apariencia'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {activeTab === 'products' && (
              <>
                <button
                  onClick={() => setActiveTab('categories')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                  title="Gestionar y crear categorías de tu catálogo"
                >
                  <Tag className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden sm:inline">Categorías</span>
                  <span className="sm:hidden">Categorías</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono font-bold">
                    {categories.length}
                  </span>
                </button>

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nuevo Producto</span>
                  <span className="sm:hidden">Nuevo</span>
                </button>
              </>
            )}

            {/* Campanita de Notificaciones / Soporte */}
            <button
              onClick={() => {
                setSupportModalInitialTab('tickets');
                setIsSupportModalOpen(true);
              }}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Notificaciones y Respuestas de Soporte"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadSupportCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadSupportCount}
                </span>
              )}
            </button>

            {/* Botón Soporte Técnico Directo */}
            <button
              onClick={() => {
                setSupportModalInitialTab('new');
                setIsSupportModalOpen(true);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Abrir mesa de ayuda y requerimientos"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Mesa de Ayuda</span>
            </button>

            <Link
              href={`/store/${tenant.slug}`}
              target="_blank"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5 text-slate-400 sm:hidden" />
              <span className="hidden sm:inline">{tenant.slug}.tenddy</span>
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
            </Link>
          </div>
        </header>

        <main className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-8 flex-1 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          {/* =========================================================================
              PESTAÑA 0: DASHBOARD (MÉTRICAS & RESUMEN)
              ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Tarjetas de Métricas Generales */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span className="text-[11px] sm:text-xs">Visitas</span>
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500" />
                  </div>
                  <div className="text-xl sm:text-3xl font-extrabold text-sky-600 mt-1 sm:mt-2 font-mono">
                    {viewsCount.toLocaleString()}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Tráfico a tienda</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs">
                  <div className="text-[11px] sm:text-xs font-medium text-slate-500">Cotizaciones</div>
                  <div className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-1 sm:mt-2 font-mono">{totalQuotes}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Total recibidas</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs">
                  <div className="text-[11px] sm:text-xs font-medium text-slate-500">Pendientes</div>
                  <div className="text-xl sm:text-3xl font-extrabold text-amber-600 mt-1 sm:mt-2 font-mono">{pendingQuotes}</div>
                  <div className="text-[10px] sm:text-[11px] text-amber-600/80 mt-0.5 font-medium">Por atender</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs">
                  <div className="text-[11px] sm:text-xs font-medium text-slate-500">Aprobadas</div>
                  <div className="text-xl sm:text-3xl font-extrabold text-emerald-600 mt-1 sm:mt-2 font-mono">{approvedQuotes}</div>
                  <div className="text-[10px] sm:text-[11px] text-emerald-600/80 mt-0.5 font-medium">Cerradas</div>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs">
                  <div className="text-[11px] sm:text-xs font-medium text-slate-500">Volumen en Demanda</div>
                  <div className="text-xl sm:text-3xl font-extrabold text-indigo-600 mt-1 sm:mt-2 font-mono">
                    {totalUnitsQuoted.toLocaleString()}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Unidades solicitadas</div>
                </div>
              </div>

              {/* Acciones Rápidas & Resumen de Negocio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setActiveTab('products')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Catálogo</span>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
                      {products.length} Productos Publicados
                    </h3>
                    <p className="text-[11px] text-slate-500">Gestionar artículos y categorías</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-sky-600 transition-all" />
                </div>

                <div
                  onClick={() => setActiveTab('quotes')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Requerimientos</span>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
                      {pendingQuotes} Cotizaciones Pendientes
                    </h3>
                    <p className="text-[11px] text-slate-500">Atender pedidos y abrir WhatsApp</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-sky-600 transition-all" />
                </div>

                <Link
                  href={`/store/${tenant.slug}`}
                  target="_blank"
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Tienda Pública</span>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
                      Ver Catálogo en Vivo
                    </h3>
                    <p className="text-[11px] text-slate-500">{tenant.slug}.tenddy</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-sky-600 transition-all" />
                </Link>
              </div>

              {/* Últimas Cotizaciones Recibidas */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Actividad Comercial Reciente</h3>
                    <p className="text-[11px] text-slate-500">Últimas solicitudes de cotización mayorista recibidas en tu tienda.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('quotes')}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ir al Módulo de Cotizaciones</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {quotes.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    Aún no has recibido solicitudes de cotización. Comparte el enlace de tu tienda con tus clientes mayoristas.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {quotes.slice(0, 5).map((q) => {
                      const quoteTotalUnits = q.items?.reduce((sum, i) => sum + (i.total_units || 0), 0) || 0;
                      return (
                        <div
                          key={q.id}
                          onClick={() => {
                            setSelectedQuote(q);
                            setActiveTab('quotes');
                          }}
                          className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{q.quote_number}</span>
                              {getStatusBadge(q.status)}
                            </div>
                            <span className="font-medium text-slate-700 truncate block mt-0.5">
                              {q.company_name ? `${q.company_name} • ${q.customer_name}` : q.customer_name}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-slate-900 block">
                              {quoteTotalUnits.toLocaleString()} uds
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(q.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 1: COTIZACIONES & PEDIDOS (MÓDULO DEDICADO)
              ========================================================================= */}
          {activeTab === 'quotes' && (
            <div className="space-y-5 sm:space-y-6">
              {/* Bandeja de Requerimientos + Detalle Lateral */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                      Requerimientos Recibidos
                    </h3>

                    <div className="w-full sm:w-auto overflow-x-auto scrollbar-none pb-0.5">
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs shrink-0">
                        {['all', 'pending', 'contacted', 'approved', 'rejected'].map((st) => (
                          <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-2.5 sm:px-3 py-1 rounded-lg capitalize font-semibold text-[11px] sm:text-xs transition-all cursor-pointer whitespace-nowrap ${
                              filterStatus === st
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            {st === 'all' ? 'Todos' : st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por # cotización, empresa o cliente..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-0.5">
                    {filteredQuotes.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 text-xs">
                        No hay cotizaciones con los filtros seleccionados.
                      </div>
                    ) : (
                      filteredQuotes.map((q) => {
                        const isSelected = selectedQuote?.id === q.id;
                        const quoteTotalUnits = q.items?.reduce(
                          (sum, i) => sum + (i.total_units || 0),
                          0
                        ) || 0;

                        return (
                          <div
                            key={q.id}
                            onClick={() => setSelectedQuote(q)}
                            className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-slate-50 border-slate-900 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {q.quote_number}
                              </span>
                              {getStatusBadge(q.status)}
                            </div>

                            <div className="flex items-baseline justify-between gap-2">
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                {q.company_name ? `${q.company_name} • ${q.customer_name}` : q.customer_name}
                              </h4>
                              <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-900 shrink-0">
                                {quoteTotalUnits.toLocaleString()} uds
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                              <span className="flex items-center gap-1 truncate max-w-[150px]">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{q.delivery_city || 'Sin ciudad'}</span>
                              </span>
                              <span className="flex items-center gap-1 shrink-0">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {new Date(q.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Detalle Lateral de Cotización */}
                <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xs lg:sticky lg:top-24">
                  {selectedQuote ? (
                    <>
                      <div className="border-b border-slate-100 pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {selectedQuote.quote_number}
                          </span>
                          {getStatusBadge(selectedQuote.status)}
                        </div>
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mt-1">
                          {selectedQuote.company_name || selectedQuote.customer_name}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                          Recibido el {new Date(selectedQuote.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Cambiar Estado Comercial
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                          {(['pending', 'contacted', 'approved', 'rejected'] as const).map((st) => (
                            <button
                              key={st}
                              disabled={isUpdating || selectedQuote.status === st}
                              onClick={() => handleUpdateStatus(selectedQuote.id, st)}
                              className={`py-1.5 px-2 rounded-lg font-semibold text-[10px] sm:text-[11px] capitalize transition-all cursor-pointer disabled:opacity-40 text-center ${
                                selectedQuote.status === st
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 sm:p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">WhatsApp / Teléfono:</span>
                          <a
                            href={`https://wa.me/${selectedQuote.customer_phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 font-bold font-mono flex items-center gap-1"
                          >
                            <span>+{selectedQuote.customer_phone}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {selectedQuote.customer_email && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Correo:</span>
                            <span className="text-slate-900 font-medium truncate max-w-[180px]">{selectedQuote.customer_email}</span>
                          </div>
                        )}

                        {selectedQuote.delivery_city && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Destino de entrega:</span>
                            <span className="text-slate-900 font-medium">{selectedQuote.delivery_city}</span>
                          </div>
                        )}

                        {selectedQuote.notes && (
                          <div className="pt-2 border-t border-slate-200 text-slate-700">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                              Notas del Cliente:
                            </span>
                            <p className="text-xs text-slate-600">{selectedQuote.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Envases Solicitados ({selectedQuote.items?.length || 0})
                        </span>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {selectedQuote.items?.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 text-xs flex justify-between items-center"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-slate-900 truncate">{item.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  SKU: {item.sku} • {item.package_count} fardos
                                </div>
                              </div>
                              <div className="text-right font-mono font-bold text-slate-900 shrink-0">
                                {item.total_units?.toLocaleString()} uds
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs py-12 text-center">
                      Toca una cotización de la lista para ver el detalle completo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: PRODUCTOS (VISTAS COMPLETAS INTEGRADAS - CERO MODAL) */}
          {activeTab === 'products' && (
            isCreateModalOpen ? (
              <CreateProductModal
                isOpen={true}
                onClose={() => setIsCreateModalOpen(false)}
                tenant={tenant}
                categories={categories}
                onCategoryCreated={(newCat) => {
                  setCategories((prev) => [...prev, newCat]);
                }}
                onProductCreated={(newProd) => {
                  setProducts((prev) => [newProd, ...prev]);
                  setIsCreateModalOpen(false);
                }}
              />
            ) : editingProduct ? (
              <EditProductModal
                isOpen={true}
                onClose={() => setEditingProduct(null)}
                product={editingProduct}
                categories={categories}
                tenant={tenant}
                onProductUpdated={(updatedProd) => {
                  setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
                  setEditingProduct(null);
                }}
              />
            ) : isBulkModalOpen ? (
              <BulkImportModal
                isOpen={true}
                onClose={() => setIsBulkModalOpen(false)}
                tenantId={tenant.id}
                onProductsImported={(newProducts) => {
                  setProducts((prev) => [...newProducts, ...prev]);
                  setIsBulkModalOpen(false);
                }}
              />
            ) : (
              <ProductsManagerView
                tenant={tenant}
                products={products}
                categories={categories}
                onProductsChanged={(updated) => setProducts(updated)}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                onOpenBulkModal={() => setIsBulkModalOpen(true)}
                onEditProduct={(p) => setEditingProduct(p)}
              />
            )
          )}

          {/* PESTAÑA: GESTIÓN DE CATEGORÍAS (CRUD COMPLETO) */}
          {activeTab === 'categories' && (
            <CategoriesManagerView
              tenantId={tenant.id}
              initialCategories={categories}
              onCategoriesChanged={(updatedCats) => setCategories(updatedCats)}
            />
          )}

          {/* PESTAÑA 3: EQUIPO & ROLES */}
          {activeTab === 'team' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs">
              <TeamTab
                tenant={tenant}
                branches={branches}
                initialMembers={initialMembers}
              />
            </div>
          )}

          {/* PESTAÑA 4: APARIENCIA */}
          {activeTab === 'appearance' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs">
              <AppearanceTab
                tenant={tenant}
                onTenantUpdated={(updated) => setTenant(updated)}
              />
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          4. BARRA DE NAVEGACIÓN INFERIOR PARA MÓVILES (md:hidden)
          ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-around py-2 px-1 shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'quotes' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Cotizaciones</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'products' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Catálogo</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'categories' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Categorías</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'appearance' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Paintbrush className="w-4 h-4" />
          <span>Diseño</span>
        </button>
      </nav>
    </div>
  );
}
