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
  FileSpreadsheet
} from 'lucide-react';
import { Tenant, Branch, Product, Category } from '@/lib/types';
import CreateProductModal from './CreateProductModal';
import AppearanceTab from './AppearanceTab';

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
}

export default function AdminDashboardView({
  tenant: initialTenant,
  branches,
  products: initialProducts,
  categories = [],
  initialQuotes,
}: AdminDashboardViewProps) {
  const [tenant, setTenant] = useState<Tenant>(initialTenant);
  const [activeTab, setActiveTab] = useState<'quotes' | 'products' | 'appearance'>('quotes');
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

  // Filtrado
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            <MessageCircle className="w-3 h-3" /> Contactado
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            <CheckCircle className="w-3 h-3" /> Aprobado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            <XCircle className="w-3 h-3" /> Descartado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Modal de Crear Producto */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        tenant={tenant}
        categories={categories}
        onProductCreated={(newProd) => setProducts((prev) => [newProd, ...prev])}
      />

      {/* Header Backoffice */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg text-sm">
              ⚙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Panel de Administración B2B
                </h1>
                <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-mono">
                  {tenant.slug}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {tenant.name} • {branches.length} Sucursal(es) • {products.length} Productos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/store/${tenant.slug}`}
              target="_blank"
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver Tienda Pública
            </Link>
          </div>
        </div>

        {/* Barra de Navegación del Panel */}
        <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`pb-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quotes'
                ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Cotizaciones ({quotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`pb-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Productos ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`pb-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'appearance'
                ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Personalizar Apariencia & Diseño</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* PESTAÑA 1: COTIZACIONES */}
        {activeTab === 'quotes' && (
          <>
            {/* Fila de Métricas Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total Cotizaciones</span>
                  <Building2 className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2 font-mono">{totalQuotes}</div>
                <div className="text-[11px] text-slate-500 mt-1">Registradas en Supabase</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Pendientes de Atención</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">{pendingQuotes}</div>
                <div className="text-[11px] text-slate-500 mt-1">Requieren contacto comercial</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Aprobadas / En Producción</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">{approvedQuotes}</div>
                <div className="text-[11px] text-slate-500 mt-1">Cerradas con éxito</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Volumen Total Cotizado</span>
                  <Package className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-cyan-400 mt-2 font-mono">
                  {totalUnitsQuoted.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Unidades de envases en demanda</div>
              </div>
            </div>

            {/* Bandeja de Cotizaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h2 className="font-bold text-base text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-sky-400" />
                    Bandeja de Requerimientos B2B
                  </h2>

                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs">
                    {['all', 'pending', 'contacted', 'approved', 'rejected'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-2.5 py-1 rounded capitalize transition-colors cursor-pointer ${
                          filterStatus === st
                            ? 'bg-sky-600 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st === 'all' ? 'Todos' : st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por # cotización, empresa, cliente o teléfono..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredQuotes.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
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
                              ? 'bg-slate-900 border-sky-500 shadow-md shadow-sky-500/10'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-xs font-bold text-sky-400">
                              {q.quote_number}
                            </span>
                            {getStatusBadge(q.status)}
                          </div>

                          <div className="flex items-baseline justify-between">
                            <h4 className="font-semibold text-white text-sm truncate max-w-[280px]">
                              {q.company_name ? `${q.company_name} • ${q.customer_name}` : q.customer_name}
                            </h4>
                            <span className="text-[11px] font-mono font-bold text-emerald-400">
                              {quoteTotalUnits.toLocaleString()} uds
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {q.delivery_city || 'Sin ciudad'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
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
              <div className="lg:col-span-5 bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col space-y-4">
                {selectedQuote ? (
                  <>
                    <div className="border-b border-slate-800 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-sky-400">
                          {selectedQuote.quote_number}
                        </span>
                        {getStatusBadge(selectedQuote.status)}
                      </div>
                      <h3 className="font-bold text-lg text-white mt-1">
                        {selectedQuote.company_name || selectedQuote.customer_name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Registrado el {new Date(selectedQuote.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Actualizar Estado Comercial
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 text-xs">
                        {(['pending', 'contacted', 'approved', 'rejected'] as const).map((st) => (
                          <button
                            key={st}
                            disabled={isUpdating || selectedQuote.status === st}
                            onClick={() => handleUpdateStatus(selectedQuote.id, st)}
                            className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] capitalize transition-colors cursor-pointer disabled:opacity-40 ${
                              selectedQuote.status === st
                                ? 'bg-sky-600 text-white shadow-md'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                        <a
                          href={`https://wa.me/${selectedQuote.customer_phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-emerald-400 font-mono underline"
                        >
                          {selectedQuote.customer_phone} (Abrir Chat)
                        </a>
                      </div>

                      {selectedQuote.customer_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                          <span className="text-slate-300">{selectedQuote.customer_email}</span>
                        </div>
                      )}

                      {selectedQuote.delivery_city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-slate-300">
                            Destino: {selectedQuote.delivery_city} {selectedQuote.delivery_address && `(${selectedQuote.delivery_address})`}
                          </span>
                        </div>
                      )}

                      {selectedQuote.notes && (
                        <div className="pt-2 border-t border-slate-800/60 text-slate-300">
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                            Notas del Cliente:
                          </span>
                          {selectedQuote.notes}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Envases Solicitados ({selectedQuote.items?.length || 0} ítems)
                      </span>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {selectedQuote.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs flex justify-between items-start"
                          >
                            <div>
                              <div className="font-semibold text-white">{item.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                SKU: {item.sku} • {item.package_count} fardos ({item.units_per_package} u/fardo)
                              </div>
                              {item.selected_color && (
                                <div className="text-[10px] text-sky-400 mt-0.5">
                                  Color: {item.selected_color}
                                </div>
                              )}
                            </div>
                            <div className="text-right font-mono font-bold text-emerald-400">
                              {item.total_units?.toLocaleString()} uds
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs py-20">
                    Selecciona una cotización para ver el desglose técnico y gestionar su estado.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* PESTAÑA 2: PRODUCTOS */}
        {activeTab === 'products' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-sky-400" />
                  Catálogo de Productos Activos ({products.length})
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Gestiona las referencias, empaques y especificaciones que ven tus compradores.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Producto
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between text-xs hover:border-slate-700 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sky-400 text-[10px] font-bold">{p.sku}</span>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="font-bold text-white text-sm line-clamp-1">{p.name}</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{p.description}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between text-[11px] font-mono text-slate-400">
                    <span>MOQ: {p.min_order_qty}</span>
                    <span>{p.units_per_package} u/fardo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: APARIENCIA & DISEÑO */}
        {activeTab === 'appearance' && (
          <AppearanceTab
            tenant={tenant}
            onTenantUpdated={(updated) => setTenant(updated)}
          />
        )}
      </main>
    </div>
  );
}
