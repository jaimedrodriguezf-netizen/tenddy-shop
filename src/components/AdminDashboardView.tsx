'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageCircle,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Palette,
  FileSpreadsheet,
  LayoutDashboard,
  Boxes,
  Paintbrush,
  LogOut,
  Store,
  ChevronDown,
  Layers,
  ArrowUpRight,
  Users,
  Eye
} from 'lucide-react';
import { Tenant, Branch, Product, Category } from '@/lib/types';
import CreateProductModal from './CreateProductModal';
import AppearanceTab from './AppearanceTab';
import TeamTab, { TenantMember } from './TeamTab';

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
  categories = [],
  initialQuotes,
  initialMembers = [],
}: AdminDashboardViewProps) {
  const [tenant, setTenant] = useState<Tenant>(initialTenant);
  const [activeTab, setActiveTab] = useState<'quotes' | 'products' | 'team' | 'appearance'>('quotes');
  const [quotes, setQuotes] = useState<QuoteRecord[]>(initialQuotes);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(quotes[0] || null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
        body: JSON.stringify({ quote_id: quoteId, status: newStatus, shopSlug: tenant.slug }),
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
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pendiente
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Contactado
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Aprobado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Descartado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex antialiased">
      {/* Modal para Crear Producto */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        tenant={tenant}
        categories={categories}
        onProductCreated={(newProd) => setProducts((prev) => [newProd, ...prev])}
      />

      {/* =========================================================================
          1. MENÚ LATERAL (SIDEBAR)
          ========================================================================= */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-30 shadow-sm">
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
                  {tenant.slug}.tenddy.shop
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Gestión B2B
            </span>

            <button
              onClick={() => setActiveTab('quotes')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'quotes'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Cotizaciones</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'quotes'
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {quotes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4" />
                <span>Catálogo de Productos</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'products'
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('team')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Equipo & Asesores</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'appearance'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Paintbrush className="w-4 h-4" />
              <span>Diseño & Apariencia</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Canal de Venta
            </span>

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

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          2. ÁREA DE CONTENIDO PRINCIPAL
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              {activeTab === 'quotes' && 'Panel de Cotizaciones & Requerimientos'}
              {activeTab === 'products' && 'Catálogo de Envases & Productos B2B'}
              {activeTab === 'team' && 'Gestión de Equipo, Asesores & Roles'}
              {activeTab === 'appearance' && 'Personalización de Marca & Diseño Web'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'products' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Producto</span>
              </button>
            )}

            <Link
              href={`/store/${tenant.slug}`}
              target="_blank"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>{tenant.slug}.tenddy.shop</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </header>

        <main className="p-8 space-y-8 flex-1 max-w-7xl mx-auto w-full">
          {/* PESTAÑA 1: COTIZACIONES */}
          {activeTab === 'quotes' && (
            <div className="space-y-6">
              {/* Tarjetas de Métricas Claras con Contador de Vistas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Visitas a la Tienda</span>
                    <Eye className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-sky-600 mt-2 font-mono">
                    {viewsCount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Tráfico total registrado</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="text-xs font-medium text-slate-500">Total Cotizaciones</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{totalQuotes}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Registradas en Supabase</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="text-xs font-medium text-slate-500">Pendientes de Contacto</div>
                  <div className="text-3xl font-extrabold text-amber-600 mt-2 font-mono">{pendingQuotes}</div>
                  <div className="text-[11px] text-amber-600/80 mt-1 font-medium">Atención requerida</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="text-xs font-medium text-slate-500">Aprobadas / Producción</div>
                  <div className="text-3xl font-extrabold text-emerald-600 mt-2 font-mono">{approvedQuotes}</div>
                  <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">Cotizaciones cerradas</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="text-xs font-medium text-slate-500">Volumen en Demanda</div>
                  <div className="text-3xl font-extrabold text-indigo-600 mt-2 font-mono">
                    {totalUnitsQuoted.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Unidades solicitadas</div>
                </div>
              </div>

              {/* Bandeja de Requerimientos + Detalle Lateral */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="font-bold text-sm text-slate-900">
                      Requerimientos Recibidos
                    </h3>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                      {['all', 'pending', 'contacted', 'approved', 'rejected'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setFilterStatus(st)}
                          className={`px-3 py-1 rounded-lg capitalize font-semibold transition-all cursor-pointer ${
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

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por # cotización, empresa, cliente o teléfono..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
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
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-slate-50 border-slate-900 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {q.quote_number}
                              </span>
                              {getStatusBadge(q.status)}
                            </div>

                            <div className="flex items-baseline justify-between">
                              <h4 className="font-bold text-slate-900 text-sm truncate max-w-[280px]">
                                {q.company_name ? `${q.company_name} • ${q.customer_name}` : q.customer_name}
                              </h4>
                              <span className="text-xs font-mono font-bold text-slate-900">
                                {quoteTotalUnits.toLocaleString()} uds
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {q.delivery_city || 'Sin ciudad'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(q.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Detalle Lateral */}
                <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 space-y-5 shadow-xs sticky top-24">
                  {selectedQuote ? (
                    <>
                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {selectedQuote.quote_number}
                          </span>
                          {getStatusBadge(selectedQuote.status)}
                        </div>
                        <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                          {selectedQuote.company_name || selectedQuote.customer_name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Recibido el {new Date(selectedQuote.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Cambiar Estado Comercial
                        </label>
                        <div className="grid grid-cols-4 gap-1.5 text-xs">
                          {(['pending', 'contacted', 'approved', 'rejected'] as const).map((st) => (
                            <button
                              key={st}
                              disabled={isUpdating || selectedQuote.status === st}
                              onClick={() => handleUpdateStatus(selectedQuote.id, st)}
                              className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] capitalize transition-all cursor-pointer disabled:opacity-40 ${
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

                      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2.5 text-xs">
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
                            <span className="text-slate-900 font-medium">{selectedQuote.customer_email}</span>
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
                            {selectedQuote.notes}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Envases Solicitados ({selectedQuote.items?.length || 0})
                        </span>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedQuote.items?.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex justify-between items-center"
                            >
                              <div>
                                <div className="font-bold text-slate-900">{item.name}</div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  SKU: {item.sku} • {item.package_count} fardos ({item.units_per_package} u/fardo)
                                </div>
                              </div>
                              <div className="text-right font-mono font-bold text-slate-900">
                                {item.total_units?.toLocaleString()} uds
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs py-20">
                      Selecciona una cotización para ver el detalle técnico.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: PRODUCTOS */}
          {activeTab === 'products' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Catálogo Activo ({products.length} Referencias)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifica y administra los productos visibles en tu catálogo público.
                  </p>
                </div>

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Producto</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between text-xs hover:border-slate-300 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-slate-500 text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {p.sku}
                        </span>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex justify-between text-[11px] font-mono text-slate-600">
                      <span>MOQ: {p.min_order_qty} uds</span>
                      <span>{p.units_per_package} / fardo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PESTAÑA 3: EQUIPO & ROLES */}
          {activeTab === 'team' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <TeamTab
                tenant={tenant}
                branches={branches}
                initialMembers={initialMembers}
              />
            </div>
          )}

          {/* PESTAÑA 4: APARIENCIA */}
          {activeTab === 'appearance' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <AppearanceTab
                tenant={tenant}
                onTenantUpdated={(updated) => setTenant(updated)}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
