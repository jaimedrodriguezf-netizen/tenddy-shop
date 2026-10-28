'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Building2,
  Package,
  MessageCircle,
  TrendingUp,
  Globe,
  ExternalLink,
  Lock,
  Search,
  CheckCircle,
  XCircle,
  Power,
  Calendar,
  LogOut,
  Users,
  Eye,
  LifeBuoy,
  Database,
  Menu,
  X,
  ImageIcon,
  ChevronRight,
  Layers,
  Sparkles,
  Copy,
  Check,
  CreditCard
} from 'lucide-react';
import SuperadminUsersManager, { B2BAccount, TenantStaffMember } from './SuperadminUsersManager';
import SuperadminSupportManager, { SupportTicketRecord } from './SuperadminSupportManager';
import SuperadminPlansManager from './SuperadminPlansManager';
import VersionBadge from './VersionBadge';
import DecoupleTenantModal from './DecoupleTenantModal';
import { Plan } from '@/lib/types';

export interface SuperadminTenantSummary {
  id: string;
  slug: string;
  name: string;
  industry_type: string;
  is_active: boolean;
  views_count: number;
  created_at: string;
  total_products: number;
  total_images?: number;
  total_quotes: number;
  total_branches: number;
  total_members: number;
  primary_domain?: string;
  is_decoupled?: boolean;
  decoupled_url?: string;
  store_template?: string;
  custom_landing_unlocked?: boolean;
  plan_slug?: string;
  plan_status?: string;
}

interface SuperadminDashboardViewProps {
  tenants: SuperadminTenantSummary[];
  totalGlobalViews: number;
  totalGlobalQuotes: number;
  totalGlobalProducts: number;
  totalGlobalImages?: number;
  totalStorageFiles?: number;
  totalGlobalUnitsQuoted: number;
  totalB2BAccounts: number;
  initialBuyers?: B2BAccount[];
  initialStaff?: TenantStaffMember[];
  initialTickets?: SupportTicketRecord[];
  initialPlans?: Plan[];
}

export default function SuperadminDashboardView({
  tenants: initialTenants,
  totalGlobalViews,
  totalGlobalQuotes,
  totalGlobalProducts,
  totalGlobalImages = 0,
  totalStorageFiles = 0,
  totalGlobalUnitsQuoted,
  totalB2BAccounts,
  initialBuyers = [],
  initialStaff = [],
  initialTickets = [],
  initialPlans = [],
}: SuperadminDashboardViewProps) {
  const [tenants, setTenants] = useState<SuperadminTenantSummary[]>(initialTenants);
  const [activeTab, setActiveTab] = useState<'tenants' | 'users' | 'support' | 'plans'>('tenants');
  const [search, setSearch] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDecoupleTenant, setSelectedDecoupleTenant] = useState<SuperadminTenantSummary | null>(null);
  const [isDecoupleModalOpen, setIsDecoupleModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      t.industry_type.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    if (!confirm(`¿Estás seguro de ${currentStatus ? 'suspender' : 'activar'} esta empresa en la plataforma?`)) return;

    setIsUpdating(true);
    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, is_active: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setTenants((prev) =>
          prev.map((t) => (t.id === tenantId ? { ...t, is_active: !currentStatus } : t))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleTemplate = async (tenantId: string, currentTemplate?: string) => {
    const nextTemplate = currentTemplate === 'landing' ? 'temu' : 'landing';
    const isUnlocked = nextTemplate === 'landing';
    const label = nextTemplate === 'landing' ? 'Landing Corporativa B2B' : 'E-Commerce Directo (Temu)';

    if (!confirm(`¿Deseas cambiar el formato asignado para esta tienda a "${label}"?`)) return;

    setIsUpdating(true);
    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          store_template: nextTemplate,
          custom_landing_unlocked: isUnlocked,
        }),
      });
      if (res.ok) {
        setTenants((prev) =>
          prev.map((t) =>
            t.id === tenantId
              ? { ...t, store_template: nextTemplate, custom_landing_unlocked: isUnlocked }
              : t
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateDecouple = async (
    tenantId: string,
    isDecoupled: boolean,
    decoupledUrl: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          is_decoupled: isDecoupled,
          decoupled_url: decoupledUrl,
        }),
      });
      if (res.ok) {
        setTenants((prev) =>
          prev.map((t) =>
            t.id === tenantId
              ? { ...t, is_decoupled: isDecoupled, decoupled_url: decoupledUrl }
              : t
          )
        );
        if (selectedDecoupleTenant?.id === tenantId) {
          setSelectedDecoupleTenant((prev) =>
            prev ? { ...prev, is_decoupled: isDecoupled, decoupled_url: decoupledUrl } : null
          );
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error actualizando modo de desacople:', err);
      return false;
    }
  };

  const handleLogout = async () => {
    await fetch('/api/superadmin/auth', { method: 'DELETE' });
    window.location.reload();
  };

  // Ítems de navegación reutilizables entre Desktop y Mobile
  const renderNavLinks = () => (
    <nav className="space-y-1.5" aria-label="Navegación de Torre de Control">
      <button
        onClick={() => {
          setActiveTab('tenants');
          setIsMobileSidebarOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'tenants'
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Fábricas & Tiendas</span>
        </div>
        <span className="text-[11px] font-mono bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800 text-slate-300">
          {tenants.length}
        </span>
      </button>

      <button
        onClick={() => {
          setActiveTab('users');
          setIsMobileSidebarOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'users'
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 shrink-0 text-purple-400" />
          <span>Usuarios & Cuentas B2B</span>
        </div>
        <span className="text-[11px] font-mono bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800 text-slate-300">
          {initialBuyers.length + initialStaff.length}
        </span>
      </button>

      <button
        onClick={() => {
          setActiveTab('support');
          setIsMobileSidebarOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'support'
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <LifeBuoy className="w-4 h-4 shrink-0 text-sky-400" />
          <span>Mesa de Ayuda & Soporte</span>
        </div>
        <span className="text-[11px] font-mono bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800 text-slate-300">
          {initialTickets.length}
        </span>
      </button>

      <button
        onClick={() => {
          setActiveTab('plans');
          setIsMobileSidebarOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'plans'
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <CreditCard className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Planes & Precios SaaS</span>
        </div>
        <span className="text-[11px] font-mono bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800 text-slate-300">
          {initialPlans.length || 3}
        </span>
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col md:flex-row">
      {/* =========================================================================
          1. BARRA LATERAL MÓVIL (Slide-over Drawer Ergonómico con Scroll)
          ========================================================================= */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative w-80 max-w-[85vw] bg-slate-950 border-r border-slate-800 h-full flex flex-col z-10 shadow-2xl overflow-hidden">
            {/* Cabecera Fija del Drawer Móvil */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-slate-950 shadow-md text-base shrink-0">
                  ⚡
                </div>
                <div>
                  <h2 className="text-xs font-extrabold text-white tracking-tight leading-tight">
                    Torre de Control
                  </h2>
                  <span className="text-[10px] text-amber-400 font-mono block">
                    tenddy Superadmin
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
                title="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navegación y Widget con Scroll Autónomo */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider px-2 block">
                  Gestión Central
                </span>
                {renderNavLinks()}
              </div>

              {/* Widget de Resumen de Inventario en Drawer Móvil */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  <span>Volumen de Plataforma</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-lg font-black text-indigo-400 font-mono">
                      {totalGlobalProducts}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Productos</div>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-lg font-black text-violet-400 font-mono">
                      {totalGlobalImages}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Imágenes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie de Página Fijo del Drawer Móvil */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950 space-y-3 shrink-0">
              <div className="flex justify-center">
                <VersionBadge />
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800/80 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* =========================================================================
          2. BARRA LATERAL DESKTOP (SIDEBAR FIJO CON SCROLL INDEPENDIENTE)
          ========================================================================= */}
      <aside className="hidden md:flex w-64 lg:w-72 bg-slate-950 border-r border-slate-800/80 flex-col shrink-0 sticky top-0 h-screen z-30 shadow-lg overflow-hidden">
        <div className="p-5 pb-4 border-b border-slate-800/80 shrink-0">
          {/* Logo & Marca */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-slate-950 shadow-lg text-lg shrink-0">
              ⚡
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-extrabold text-white tracking-tight truncate leading-tight">
                Torre de Control
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                  Superadmin
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Menú de Navegación */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider px-2 block">
              Gestión Central
            </span>
            {renderNavLinks()}
          </div>

          {/* Widget de Resumen de Inventario en Sidebar */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>Volumen de Plataforma</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-lg font-black text-indigo-400 font-mono">
                  {totalGlobalProducts}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Productos</div>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-lg font-black text-violet-400 font-mono">
                  {totalGlobalImages}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Imágenes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950 space-y-3 shrink-0">
          <div className="flex justify-center">
            <VersionBadge />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800/80 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          3. CONTENIDO PRINCIPAL (MAIN VIEW)
          ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Navbar Superior Móvil */}
        <header className="md:hidden flex items-center justify-between p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              title="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-extrabold text-sm text-white">Torre de Control</span>
          </div>
          <div className="flex items-center gap-2">
            <VersionBadge />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-8 space-y-6 sm:space-y-8 flex-1 max-w-7xl w-full mx-auto">
          {/* Header de Contexto */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                {activeTab === 'tenants' && 'Directorio de Fábricas & Tiendas'}
                {activeTab === 'users' && 'Directorio de Usuarios & Clientes B2B'}
                {activeTab === 'support' && 'Mesa de Ayuda & Tickets de Soporte'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'tenants' && `Supervisa el tráfico de visitas, inventario y catálogo de las ${tenants.length} tiendas activas.`}
                {activeTab === 'users' && `Gestiona los compradores B2B y el staff administrativo de todas las empresas.`}
                {activeTab === 'support' && `Atiende y resuelve requerimientos y reportes con capturas de pantalla.`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Superadmin Activo</span>
              </span>
            </div>
          </div>

          {/* Grid de Métricas Globales (6 Tarjetas Informativas) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* 1. Tráfico */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Visitas Red</span>
                <Eye className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 mt-2 font-mono">
                {(totalGlobalViews || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Tráfico total</div>
            </div>

            {/* 2. Productos Subidos */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Productos</span>
                <Package className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mt-2 font-mono">
                {(totalGlobalProducts || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Catálogo activo</div>
            </div>

            {/* 3. Imágenes Subidas */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Imágenes</span>
                <ImageIcon className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-violet-400 mt-2 font-mono">
                {(totalGlobalImages || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Fotos en catálogo</div>
            </div>

            {/* 4. Fábricas Desplegadas */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Fábricas</span>
                <Building2 className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-mono">
                {tenants.filter((t) => t.is_active).length} / {tenants.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Tenants activos</div>
            </div>

            {/* 5. Cotizaciones */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Cotizaciones</span>
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
                {totalGlobalQuotes}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Leads comerciales</div>
            </div>

            {/* 6. Compradores B2B */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Cuentas B2B</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-2 font-mono">
                {totalB2BAccounts}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Empresas clientes</div>
            </div>
          </div>

          {/* PESTAÑA 1: GESTIÓN DE TIENDAS */}
          {activeTab === 'tenants' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    Directorio Global de Tiendas ({tenants.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supervisa el tráfico de visitas, catálogo y fotos de cada fábrica en la plataforma.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por tienda o subdominio..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Fábrica / Empresa</th>
                      <th className="py-3 px-4">Giro / Industria</th>
                      <th className="py-3 px-4">Tráfico / Visitas</th>
                      <th className="py-3 px-4">Catálogo & Media</th>
                      <th className="py-3 px-4">Cotizaciones</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones de Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{t.name}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Link
                              href={`/store/${t.slug}`}
                              target="_blank"
                              className="text-[11px] font-mono text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 group truncate max-w-[200px]"
                              title={`Abrir tienda pública: ${t.primary_domain || `${t.slug}.tenddy.shop`}`}
                            >
                              <span>{t.primary_domain || `${t.slug}.tenddy.shop`}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 shrink-0" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tenddy.shop';
                                const fullUrl = `${origin}/store/${t.slug}`;
                                if (navigator?.clipboard) {
                                  navigator.clipboard.writeText(fullUrl);
                                  setCopiedSlug(t.slug);
                                  setTimeout(() => setCopiedSlug(null), 2000);
                                }
                              }}
                              className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                              title="Copiar URL pública completa"
                            >
                              {copiedSlug === t.slug ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="capitalize bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-medium text-slate-300">
                            {t.industry_type}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full text-[11px]">
                            <Eye className="w-3 h-3" />
                            {(t.views_count || 0).toLocaleString()} visitas
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <Package className="w-3 h-3 text-indigo-400" />
                              <span>{t.total_products} productos</span>
                            </span>
                            <span className="text-[11px] text-violet-400 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-violet-400" />
                              <span>{(t.total_images || 0)} imágenes</span>
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {t.total_quotes} cotizaciones
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            {t.is_active ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Activa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-rose-400 font-semibold text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                Suspendida
                              </span>
                            )}

                            {/* Badge y Selector de Plantilla Gobernado por Superadmin */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {t.store_template === 'landing' ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleTemplate(t.id, t.store_template)}
                                  disabled={isUpdating}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                                  title="Formato: Landing Corporativa B2B (Clic de Superadmin para cambiar a Catálogo Temu)"
                                >
                                  <span>🏭 Landing VIP</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleTemplate(t.id, t.store_template)}
                                  disabled={isUpdating}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                                  title="Formato: Catálogo Temu Estándar (Clic de Superadmin para promover a Landing Corporativa)"
                                >
                                  <span>🛍️ Catálogo Temu</span>
                                </button>
                              )}

                              {/* Badge de Plan Comercial */}
                              <button
                                type="button"
                                onClick={() => setActiveTab('plans')}
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                                title="Plan comercial asignado. Clic para ir a Planes & Precios"
                              >
                                <span>💎 {t.plan_slug ? t.plan_slug.toUpperCase() : 'STARTER'}</span>
                              </button>
                            </div>

                            {t.is_decoupled && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full"
                                title={t.decoupled_url ? `Redirige a: ${t.decoupled_url}` : 'Base/Instancia Dedicada'}
                              >
                                <span>⚡ Desacoplada</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDecoupleTenant(t);
                                setIsDecoupleModalOpen(true);
                              }}
                              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                                t.is_decoupled
                                  ? 'text-purple-300 hover:text-white bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/40 shadow-sm'
                                  : 'bg-slate-900 hover:bg-slate-800 text-purple-400 hover:text-purple-300 border-slate-800'
                              }`}
                              title="Desacoplar / Exportar a Base Dedicada"
                            >
                              <Database className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              href={`/store/${t.slug}`}
                              target="_blank"
                              className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white p-2 rounded-lg border border-slate-800 transition-colors"
                              title="Visitar Tienda Pública"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <Link
                              href={`/store/${t.slug}/admin`}
                              target="_blank"
                              className="bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 p-2 rounded-lg border border-slate-800 transition-colors"
                              title="Abrir Panel Admin de la Tienda"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => handleToggleStatus(t.id, t.is_active)}
                              disabled={isUpdating}
                              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                                t.is_active
                                  ? 'text-rose-400 hover:bg-rose-500/10 border-rose-500/20'
                                  : 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20'
                              }`}
                              title={t.is_active ? 'Suspender Tienda' : 'Reactivar Tienda'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: CRUD DE USUARIOS */}
          {activeTab === 'users' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <SuperadminUsersManager
                initialBuyers={initialBuyers}
                initialStaff={initialStaff}
              />
            </div>
          )}

          {/* PESTAÑA 3: MESA DE AYUDA & SOPORTE CON CAPTURAS */}
          {activeTab === 'support' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <SuperadminSupportManager
                initialTickets={initialTickets}
              />
            </div>
          )}

          {/* PESTAÑA 4: PLANES Y PRECIOS SAAS */}
          {activeTab === 'plans' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <SuperadminPlansManager
                initialPlans={initialPlans}
                tenants={tenants}
                onTenantPlanUpdated={(tenantId, newPlanSlug) => {
                  setTenants((prev) =>
                    prev.map((t) => (t.id === tenantId ? { ...t, plan_slug: newPlanSlug } : t))
                  );
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* MODAL DE GRADUACIÓN / DESACOPLE */}
      <DecoupleTenantModal
        tenant={selectedDecoupleTenant}
        isOpen={isDecoupleModalOpen}
        onClose={() => {
          setIsDecoupleModalOpen(false);
          setSelectedDecoupleTenant(null);
        }}
        onUpdateTenant={handleUpdateDecouple}
      />
    </div>
  );
}
