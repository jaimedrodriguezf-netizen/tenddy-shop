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
  Eye
} from 'lucide-react';
import SuperadminUsersManager, { B2BAccount, TenantStaffMember } from './SuperadminUsersManager';

export interface SuperadminTenantSummary {
  id: string;
  slug: string;
  name: string;
  industry_type: string;
  is_active: boolean;
  views_count: number;
  created_at: string;
  total_products: number;
  total_quotes: number;
  total_branches: number;
  total_members: number;
}

interface SuperadminDashboardViewProps {
  tenants: SuperadminTenantSummary[];
  totalGlobalViews: number;
  totalGlobalQuotes: number;
  totalGlobalProducts: number;
  totalGlobalUnitsQuoted: number;
  totalB2BAccounts: number;
  initialBuyers?: B2BAccount[];
  initialStaff?: TenantStaffMember[];
}

export default function SuperadminDashboardView({
  tenants: initialTenants,
  totalGlobalViews,
  totalGlobalQuotes,
  totalGlobalProducts,
  totalGlobalUnitsQuoted,
  totalB2BAccounts,
  initialBuyers = [],
  initialStaff = [],
}: SuperadminDashboardViewProps) {
  const [tenants, setTenants] = useState<SuperadminTenantSummary[]>(initialTenants);
  const [activeTab, setActiveTab] = useState<'tenants' | 'users'>('tenants');
  const [search, setSearch] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleLogout = async () => {
    await fetch('/api/superadmin/auth', { method: 'DELETE' });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header Superadmin */}
      <header className="border-b border-slate-800 bg-slate-950 px-8 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-slate-950 shadow-lg text-lg">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  Torre de Control Superadmin
                </h1>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  SaaS Owner
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestión Central de la Red tenddy.shop • {tenants.length} Tiendas Registradas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>Ver Portada tenddy.shop</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>

        {/* Selector de Pestañas Principales */}
        <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`pb-1 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tenants'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Fábricas & Tiendas ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-1 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>CRUD de Usuarios & Cuentas B2B ({initialBuyers.length + initialStaff.length})</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Métricas Globales de la Plataforma */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Tráfico Global de la Red</span>
              <Eye className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-3xl font-extrabold text-sky-400 mt-2 font-mono">
              {totalGlobalViews.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Visitas en todas las tiendas</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Fábricas Activas</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-2 font-mono">
              {tenants.filter((t) => t.is_active).length} / {tenants.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Multi-tenant desplegados</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Cotizaciones Globales</span>
              <MessageCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
              {totalGlobalQuotes}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Leads transaccionados</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Empresas Compradoras</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-purple-400 mt-2 font-mono">
              {totalB2BAccounts}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Cuentas universales B2B</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Volumen Total Cotizado</span>
              <Package className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-indigo-400 mt-2 font-mono">
              {totalGlobalUnitsQuoted.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Unidades en demanda</div>
          </div>
        </div>

        {/* PESTAÑA 1: GESTIÓN DE TIENDAS */}
        {activeTab === 'tenants' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  Directorio Global de Tiendas en tenddy.shop
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Supervisa el tráfico de visitas, catálogo y métricas de cada cliente en la plataforma.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por tienda, subdominio o industria..."
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
                    <th className="py-3 px-4">Catálogo</th>
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
                        <div className="text-[11px] font-mono text-sky-400 mt-0.5">
                          {t.slug}.tenddy.shop
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
                          {t.views_count.toLocaleString()} visitas
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {t.total_products} productos
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {t.total_quotes} cotizaciones
                      </td>

                      <td className="py-3.5 px-4">
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
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
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
      </main>
    </div>
  );
}
