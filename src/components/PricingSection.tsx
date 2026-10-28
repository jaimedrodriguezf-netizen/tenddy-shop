'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  Package,
  Camera,
  FileSpreadsheet,
  Building2,
  Globe,
  ArrowRight,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { Plan } from '@/lib/types';
import { DEFAULT_PLANS } from '@/lib/plans';

interface PricingSectionProps {
  initialPlans?: Plan[];
}

export default function PricingSection({ initialPlans = DEFAULT_PLANS }: PricingSectionProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [isLoading, setIsLoading] = useState(false);

  // Sincronización en tiempo real con la API pública de planes
  useEffect(() => {
    let isMounted = true;
    async function fetchPlans() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/plans');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data?.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans);
        }
      } catch (err) {
        // Fallback transparente a los planes por defecto
        console.warn('Nota: Usando catálogo de planes base predeterminado:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="pricing" className="relative py-16 sm:py-24 border-t border-slate-800 bg-slate-950 overflow-hidden">
      {/* Resplandor de fondo ambiental */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-sky-600/10 via-amber-500/5 to-indigo-600/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado de la Sección de Precios */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tarifas 100% Anuales · Cero Letras Chicas</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Escoge el Plan que se Ajusta al Tamaño de tu Catálogo
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Inicia gratis o asegura una tarifa anual fija con flujo de caja predecible. Sin comisiones por venta, sin sorpresas y con pedidos directos a tu WhatsApp.
          </p>
        </div>

        {/* Grilla Dinámica de Planes (Totalmente conectada a la BD / API) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5 items-stretch">
          {plans.map((plan) => {
            const isFree = plan.price_yearly === 0;
            const isPopular = plan.badge === 'Más Popular' || plan.slug === 'plan_500';
            const isEnterprise = plan.slug === 'enterprise';
            const monthlyEquivalent = isFree ? 0 : Math.round(plan.price_yearly / 12);

            return (
              <div
                key={plan.slug}
                className={`relative flex flex-col justify-between bg-slate-900/80 border rounded-2xl p-5 transition-all duration-300 ${
                  isPopular
                    ? 'border-amber-500/60 shadow-xl shadow-amber-500/10 bg-gradient-to-b from-slate-900 via-slate-900/90 to-amber-950/20 lg:-translate-y-2'
                    : isEnterprise
                    ? 'border-indigo-500/40 hover:border-indigo-500/60 shadow-lg shadow-indigo-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Badge Superior */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md whitespace-nowrap ${
                        isPopular
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950'
                          : isEnterprise
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Nombre y Descripción */}
                  <div className="mt-2 text-center">
                    <h3 className="text-lg font-bold text-white tracking-tight">{plan.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 min-h-[34px] leading-snug">
                      {plan.description}
                    </p>
                  </div>

                  {/* Precio */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
                    {isFree ? (
                      <div>
                        <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                          $0
                        </span>
                        <span className="text-xs text-slate-400 font-medium block mt-0.5">
                          Para siempre · Sin tarjeta
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                            ${plan.price_yearly}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">/año</span>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                          Equivale a ~${monthlyEquivalent} USD/mes
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Resumen de Capacidades Técnicas */}
                  <div className="mt-4 bg-slate-950/70 rounded-xl p-3 border border-slate-800/70 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-semibold">
                        {plan.limits.max_products === -1
                          ? 'Catálogo ilimitado'
                          : `Hasta ${plan.limits.max_products} productos`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-200">
                      <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>
                        {plan.limits.max_images_per_product === -1
                          ? 'Fotos ilimitadas + Video'
                          : `${plan.limits.max_images_per_product} ${
                              plan.limits.max_images_per_product === 1 ? 'foto principal' : 'fotos x producto'
                            }`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-200">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        {plan.limits.bulk_import_allowed ? (
                          <span className="text-emerald-300 font-semibold">Carga Masiva Excel (.xlsx)</span>
                        ) : (
                          <span className="text-slate-400">Carga individual</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-200">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>
                        {plan.limits.max_branches === -1
                          ? 'Plantas ilimitadas'
                          : `${plan.limits.max_branches} ${
                              plan.limits.max_branches === 1 ? 'Sucursal/Planta' : 'Sucursales'
                            }`}
                      </span>
                    </div>

                    {plan.limits.custom_domain_allowed && (
                      <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                        <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Dominio propio (.com)</span>
                      </div>
                    )}
                  </div>

                  {/* Checklist de Viñetas Comerciales */}
                  <div className="mt-4 pt-3 border-t border-slate-800/60">
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Botón de Acción Dinámico */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <Link
                    href={`/registro?plan=${plan.slug}`}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                      isPopular
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                        : isEnterprise
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/20'
                        : isFree
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                        : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
                    }`}
                  >
                    <span>{isFree ? 'Comenzar Gratis' : isEnterprise ? 'Contratar Corporativo' : 'Elegir Plan'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Garantía y Asesoría B2B */}
        <div className="mt-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">¿Tienes más de 5.000 productos o requieres migración asistida?</div>
              <div className="text-[11px] text-slate-400">Nuestro equipo técnico te ayuda a estructurar tus fichas técnicas y catálogos en Excel.</div>
            </div>
          </div>
          <Link
            href="/registro?plan=enterprise"
            className="text-xs font-bold text-sky-400 hover:text-sky-300 bg-slate-950 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl transition-all whitespace-nowrap shrink-0"
          >
            Hablar con un Especialista
          </Link>
        </div>
      </div>
    </section>
  );
}
