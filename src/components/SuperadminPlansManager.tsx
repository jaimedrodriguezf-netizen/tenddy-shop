'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Sparkles,
  Check,
  X,
  Edit3,
  Building2,
  Package,
  Layers,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Globe,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  AlertTriangle
} from 'lucide-react';
import { Plan, PlanLimits, TenantSubscription } from '@/lib/types';
import { DEFAULT_PLANS, formatPlanPrice, calculateAnnualSavings } from '@/lib/plans';
import { SuperadminTenantSummary } from './SuperadminDashboardView';

interface SuperadminPlansManagerProps {
  initialPlans?: Plan[];
  tenants: SuperadminTenantSummary[];
  onTenantPlanUpdated?: (tenantId: string, newPlanSlug: string) => void;
}

export default function SuperadminPlansManager({
  initialPlans = DEFAULT_PLANS,
  tenants,
  onTenantPlanUpdated,
}: SuperadminPlansManagerProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [tenantSearch, setTenantSearch] = useState('');
  
  // Modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTenantForAssign, setSelectedTenantForAssign] = useState<SuperadminTenantSummary | null>(null);
  const [assignPlanSlug, setAssignPlanSlug] = useState('pro');
  const [assignBillingCycle, setAssignBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [assignNotes, setAssignNotes] = useState('');
  
  // Estados de carga
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Formulario de edición / creación de plan
  const [formData, setFormData] = useState({
    id: '',
    slug: '',
    name: '',
    description: '',
    price_monthly: 19,
    price_yearly: 190,
    currency: 'USD',
    badge: '',
    sort_order: 1,
    is_active: true,
    is_public: true,
    features_text: '',
    // Límites
    max_products: 50,
    max_branches: 1,
    max_team_members: 2,
    custom_domain_allowed: false,
    custom_landing_allowed: false,
    bulk_import_allowed: false,
    support_priority: 'standard' as 'standard' | 'priority' | 'dedicated_24_7',
    max_storage_mb: 250,
    analytics_enabled: false,
    remove_branding: false,
  });

  // Calcular distribución de tenants por plan
  const tenantCountBySlug: Record<string, number> = {};
  tenants.forEach((t) => {
    const slug = t.plan_slug || 'starter';
    tenantCountBySlug[slug] = (tenantCountBySlug[slug] || 0) + 1;
  });

  // Métricas financieras proyectadas
  const projectedMRR = tenants.reduce((acc, t) => {
    const slug = t.plan_slug || 'starter';
    const plan = plans.find((p) => p.slug === slug) || DEFAULT_PLANS.find((p) => p.slug === slug);
    return acc + (plan?.price_monthly || 0);
  }, 0);

  const projectedARR = projectedMRR * 12;

  const showNotification = (text: string, type: 'success' | 'error') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      id: '',
      slug: '',
      name: '',
      description: '',
      price_monthly: 29,
      price_yearly: 290,
      currency: 'USD',
      badge: '',
      sort_order: plans.length + 1,
      is_active: true,
      is_public: true,
      features_text: 'Catálogo digital activo\nSoporte estándar por WhatsApp\nHasta 100 productos',
      max_products: 100,
      max_branches: 1,
      max_team_members: 2,
      custom_domain_allowed: false,
      custom_landing_allowed: false,
      bulk_import_allowed: false,
      support_priority: 'standard',
      max_storage_mb: 500,
      analytics_enabled: false,
      remove_branding: false,
    });
    setIsEditModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description || '',
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      currency: plan.currency || 'USD',
      badge: plan.badge || '',
      sort_order: plan.sort_order || 0,
      is_active: plan.is_active,
      is_public: plan.is_public,
      features_text: plan.features.join('\n'),
      max_products: plan.limits.max_products,
      max_branches: plan.limits.max_branches,
      max_team_members: plan.limits.max_team_members,
      custom_domain_allowed: plan.limits.custom_domain_allowed,
      custom_landing_allowed: plan.limits.custom_landing_allowed,
      bulk_import_allowed: plan.limits.bulk_import_allowed,
      support_priority: plan.limits.support_priority,
      max_storage_mb: plan.limits.max_storage_mb,
      analytics_enabled: Boolean(plan.limits.analytics_enabled),
      remove_branding: Boolean(plan.limits.remove_branding),
    });
    setIsEditModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPlan(true);

    const features = formData.features_text
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const payload = {
      id: formData.id || undefined,
      slug: formData.slug,
      name: formData.name,
      description: formData.description,
      price_monthly: Number(formData.price_monthly),
      price_yearly: Number(formData.price_yearly),
      currency: formData.currency,
      badge: formData.badge,
      sort_order: Number(formData.sort_order),
      is_active: formData.is_active,
      is_public: formData.is_public,
      features,
      limits: {
        max_products: Number(formData.max_products),
        max_branches: Number(formData.max_branches),
        max_team_members: Number(formData.max_team_members),
        custom_domain_allowed: formData.custom_domain_allowed,
        custom_landing_allowed: formData.custom_landing_allowed,
        bulk_import_allowed: formData.bulk_import_allowed,
        support_priority: formData.support_priority,
        max_storage_mb: Number(formData.max_storage_mb),
        analytics_enabled: formData.analytics_enabled,
        remove_branding: formData.remove_branding,
      },
    };

    try {
      const isUpdating = Boolean(editingPlan);
      const res = await fetch('/api/superadmin/plans', {
        method: isUpdating ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el plan');
      }

      if (isUpdating) {
        setPlans((prev) => prev.map((p) => (p.slug === payload.slug ? { ...p, ...payload, id: p.id } : p)));
        showNotification(`Plan "${payload.name}" actualizado con éxito`, 'success');
      } else {
        const newPlan = { ...payload, id: data.plan?.id || `plan_${Date.now()}` } as Plan;
        setPlans((prev) => [...prev, newPlan].sort((a, b) => a.sort_order - b.sort_order));
        showNotification(`Plan "${payload.name}" creado con éxito`, 'success');
      }

      setIsEditModalOpen(false);
    } catch (err: any) {
      showNotification(err.message || 'Error inesperado', 'error');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleTogglePlanActive = async (plan: Plan) => {
    const nextState = !plan.is_active;
    try {
      const res = await fetch('/api/superadmin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: plan.slug, is_active: nextState }),
      });
      if (!res.ok) throw new Error('No se pudo cambiar el estado del plan');
      setPlans((prev) => prev.map((p) => (p.slug === plan.slug ? { ...p, is_active: nextState } : p)));
      showNotification(`Plan "${plan.name}" ${nextState ? 'activado' : 'desactivado'}`, 'success');
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedTenantForAssign) return;
    setIsAssigning(true);

    try {
      const res = await fetch('/api/superadmin/tenants/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: selectedTenantForAssign.id,
          plan_slug: assignPlanSlug,
          billing_cycle: assignBillingCycle,
          notes: assignNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al asignar el plan');

      if (onTenantPlanUpdated) {
        onTenantPlanUpdated(selectedTenantForAssign.id, assignPlanSlug);
      }

      showNotification(`Plan "${assignPlanSlug.toUpperCase()}" asignado a ${selectedTenantForAssign.name}`, 'success');
      setIsAssignModalOpen(false);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.slug.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      (t.plan_slug && t.plan_slug.toLowerCase().includes(tenantSearch.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Encabezado y Métricas SaaS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Planes & Facturación SaaS</h2>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
              Motor Activo
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gobernanza de suscripciones, límites de catálogo, funciones premium y proyección de ingresos de Tenddy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switch Mensual / Anual */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                billingCycle === 'monthly' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                billingCycle === 'yearly' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Anual</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                Ahorro 20%
              </span>
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Plan</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>MRR Estimado</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            ${projectedMRR.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD/mes</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>ARR Proyectado</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            ${projectedARR.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD/año</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Planes Comerciales</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {plans.length} <span className="text-xs font-normal text-slate-400">({plans.filter(p => p.is_active).length} activos)</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Empresas Asignadas</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {tenants.length} <span className="text-xs font-normal text-slate-400">tenants</span>
          </div>
        </div>
      </div>

      {/* Grid de Planes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Catálogo Oficial de Planes</span>
          </h3>
          <span className="text-xs text-slate-400">
            Los cambios de precio o límites aplican en tiempo real al motor de gobernanza.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
            const savings = calculateAnnualSavings(plan.price_monthly, plan.price_yearly);
            const enrolledCount = tenantCountBySlug[plan.slug] || 0;

            return (
              <div
                key={plan.slug}
                className={`relative flex flex-col justify-between bg-slate-900/70 border rounded-2xl p-5 transition-all ${
                  plan.badge
                    ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                } ${!plan.is_active ? 'opacity-60 bg-slate-950/80' : ''}`}
              >
                {/* Badge promocional superior */}
                {plan.badge && (
                  <div className="absolute -top-3 left-5">
                    <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Encabezado del Plan */}
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <div>
                      <h4 className="text-base font-bold text-white">{plan.name}</h4>
                      <span className="font-mono text-[11px] text-slate-400">slug: {plan.slug}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          plan.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {plan.is_active ? 'Activo' : 'Archivado'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 min-h-[32px] leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Precio */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold font-mono text-white">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        /{billingCycle === 'yearly' ? 'año' : 'mes'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && savings.percent > 0 && (
                      <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                        Ahorra ${savings.savedAmount.toFixed(0)} al año ({savings.percent}% de descuento)
                      </p>
                    )}
                  </div>

                  {/* Resumen de Límites Técnicos Clave */}
                  <div className="mt-4 bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Package className="w-3.5 h-3.5 text-amber-400" /> Productos:
                      </span>
                      <span className="font-mono font-semibold">
                        {plan.limits.max_products === -1 ? 'Ilimitados' : `Hasta ${plan.limits.max_products}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Sucursales / Plantas:
                      </span>
                      <span className="font-mono font-semibold">
                        {plan.limits.max_branches === -1 ? 'Ilimitadas' : `Hasta ${plan.limits.max_branches}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" /> Dominio Propio:
                      </span>
                      <span className="font-mono font-semibold">
                        {plan.limits.custom_domain_allowed ? (
                          <span className="text-emerald-400">Incluido</span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Importación Excel:
                      </span>
                      <span className="font-mono font-semibold">
                        {plan.limits.bulk_import_allowed ? (
                          <span className="text-emerald-400">Habilitada</span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Soporte:
                      </span>
                      <span className="font-semibold text-[11px] capitalize">
                        {plan.limits.support_priority === 'dedicated_24_7'
                          ? 'VIP 24/7'
                          : plan.limits.support_priority === 'priority'
                          ? 'Prioritario 24h'
                          : 'Estándar'}
                      </span>
                    </div>
                  </div>

                  {/* Viñetas Comerciales (Features) */}
                  <div className="mt-4 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Incluye:
                    </span>
                    <ul className="space-y-1 mt-1">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer de Tarjeta: Empresas Asignadas y Acciones */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {enrolledCount} {enrolledCount === 1 ? 'empresa' : 'empresas'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePlanActive(plan)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                        plan.is_active
                          ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                          : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {plan.is_active ? 'Archivar' : 'Activar'}
                    </button>

                    <button
                      onClick={() => openEditModal(plan)}
                      className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Asignación de Plan por Empresa */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Gobernanza y Asignación de Planes a Tiendas</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Administra qué plan tiene cada fábrica o comercio en la plataforma y modifica su nivel contractual.
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar tienda o plan..."
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Tabla de Tenants */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-3 pl-2">Empresa / Tienda</th>
                <th className="pb-3">Industria</th>
                <th className="pb-3">Plan Actual</th>
                <th className="pb-3">Productos / Límite</th>
                <th className="pb-3 text-right pr-2">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredTenants.map((t) => {
                const assignedSlug = t.plan_slug || 'starter';
                const currentPlan = plans.find((p) => p.slug === assignedSlug) || DEFAULT_PLANS.find((p) => p.slug === assignedSlug);
                const limitMax = currentPlan?.limits.max_products ?? 50;
                const isOverLimit = limitMax !== -1 && t.total_products > limitMax;

                return (
                  <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{t.slug}.tenddy.shop</div>
                    </td>
                    <td className="py-3 text-slate-400 capitalize">{t.industry_type || 'General'}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-lg font-mono text-xs text-amber-300 font-bold">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {currentPlan?.name || assignedSlug.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 font-mono">
                      <span className={isOverLimit ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {t.total_products}
                      </span>
                      <span className="text-slate-500"> / {limitMax === -1 ? '∞' : limitMax}</span>
                      {isOverLimit && (
                        <span className="ml-2 text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                          Excede cupo
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={() => {
                          setSelectedTenantForAssign(t);
                          setAssignPlanSlug(assignedSlug);
                          setIsAssignModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-all border border-slate-700/80 cursor-pointer"
                      >
                        Cambiar Plan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Crear / Editar Plan */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editingPlan ? `Editar Plan: ${editingPlan.name}` : 'Crear Nuevo Plan Comercial'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: E-Commerce B2B Pro"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Slug Identificador (único) *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingPlan)}
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Ej: pro"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Resumen del valor comercial para la empresa..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Precios y Badge */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Precio Mensual ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Precio Anual ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Destacado</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="Ej: Más Popular"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Límites Técnicos */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Límites Técnicos del Motor (-1 = Ilimitado)
                </span>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Max Productos</label>
                    <input
                      type="number"
                      value={formData.max_products}
                      onChange={(e) => setFormData({ ...formData, max_products: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Max Sucursales</label>
                    <input
                      type="number"
                      value={formData.max_branches}
                      onChange={(e) => setFormData({ ...formData, max_branches: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Max Miembros</label>
                    <input
                      type="number"
                      value={formData.max_team_members}
                      onChange={(e) => setFormData({ ...formData, max_team_members: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Soporte SLA</label>
                    <select
                      value={formData.support_priority}
                      onChange={(e) => setFormData({ ...formData, support_priority: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="standard">Estándar</option>
                      <option value="priority">Prioritario 24h</option>
                      <option value="dedicated_24_7">VIP Dedicado 24/7</option>
                    </select>
                  </div>
                </div>

                {/* Flags booleanos */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.custom_domain_allowed}
                      onChange={(e) => setFormData({ ...formData, custom_domain_allowed: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>Dominio Propio</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.custom_landing_allowed}
                      onChange={(e) => setFormData({ ...formData, custom_landing_allowed: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>Landing Modular</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bulk_import_allowed}
                      onChange={(e) => setFormData({ ...formData, bulk_import_allowed: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>Importación Excel</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.remove_branding}
                      onChange={(e) => setFormData({ ...formData, remove_branding: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>Sin Marca Tenddy</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>Plan Activo</span>
                  </label>
                </div>
              </div>

              {/* Viñetas Comerciales */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Viñetas Comerciales (una por línea)
                </label>
                <textarea
                  rows={4}
                  value={formData.features_text}
                  onChange={(e) => setFormData({ ...formData, features_text: e.target.value })}
                  placeholder="Catálogo móvil y web&#10;Cotizaciones directas a WhatsApp&#10;Subdominio tenddy.shop incluido"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPlan}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/10 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingPlan ? 'Guardando...' : editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Asignar Plan a Tenant */}
      {isAssignModalOpen && selectedTenantForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Asignar Plan Comercial</h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="text-slate-400">Empresa Seleccionada:</div>
                <div className="font-bold text-white text-sm mt-0.5">{selectedTenantForAssign.name}</div>
                <div className="font-mono text-slate-500 mt-0.5">{selectedTenantForAssign.slug}.tenddy.shop</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nuevo Plan a Asignar</label>
                <select
                  value={assignPlanSlug}
                  onChange={(e) => setAssignPlanSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {plans.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} (${p.price_monthly} USD/mes)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ciclo de Facturación</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignBillingCycle('monthly')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      assignBillingCycle === 'monthly'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Facturación Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignBillingCycle('yearly')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      assignBillingCycle === 'yearly'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Facturación Anual
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nota Administrativa (Opcional)</label>
                <input
                  type="text"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Ej: Renovación anual con descuento comercial"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isAssigning}
                onClick={handleAssignPlan}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/10 disabled:opacity-50 cursor-pointer"
              >
                {isAssigning ? 'Asignando...' : 'Confirmar Asignación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
