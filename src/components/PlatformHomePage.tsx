'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Globe,
  MessageCircle,
  Building2,
  Lock,
  LifeBuoy,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import AdminLoginModal from './AdminLoginModal';
import SupportTicketModal from './SupportTicketModal';
import VersionBadge from './VersionBadge';
import { supabase } from '@/lib/supabase';

export default function PlatformHomePage() {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Detección automática en caso de retorno con hash de tokens OAuth
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          window.location.href = '/registro';
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Modales */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      <SupportTicketModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        shopName="tenddy Plataforma"
      />

      {/* Header Central de la Plataforma (Optimizado Móvil) */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo y Marca */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-blue-700 flex items-center justify-center font-bold text-white shadow-md shadow-sky-500/20 text-base sm:text-xl">
              T
            </div>
            <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">tenddy</span>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Características B2B</a>
            <a href="#cases" className="hover:text-white transition-colors">Casos de Uso</a>
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LifeBuoy className="w-4 h-4 text-amber-400" />
              <span>Soporte Técnico</span>
            </button>
          </nav>

          {/* Acciones de Cabecera (Totalmente responsivas) */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Botón Acceso Administrador */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Acceso al panel administrativo de tu tienda"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Acceso Administrador</span>
              <span className="sm:hidden text-[11px]">Admin</span>
            </button>

            {/* Botón Crear Tienda */}
            <Link
              href="/registro"
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-md shadow-sky-600/30 transition-all flex items-center gap-1.5 shrink-0"
            >
              <span className="hidden sm:inline">Crear Tienda B2B</span>
              <span className="sm:hidden text-[11px]">Crear Tienda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Principal SaaS (Ajustado para no ahogar en móvil) */}
      <section className="relative overflow-hidden py-12 sm:py-20 md:py-32 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] sm:text-xs px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>Motor SaaS E-Commerce Multi-Tenant B2B</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            El E-Commerce Mayorista para <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">Fabricantes y Distribuidores</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
            Despliega en minutos tu catálogo corporativo con pedidos por volumen (MOQ), fichas técnicas, cotizaciones automáticas y WhatsApp directo por sucursal.
          </p>

          {/* Botones de Acción (Stackeados verticalmente en móvil, lado a lado en desktop) */}
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
            <Link
              href="/registro"
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm py-3.5 px-8 rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Crear Tienda Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm py-3.5 px-6 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LifeBuoy className="w-4 h-4 text-amber-400" />
              <span>Mesa de Ayuda & Soporte</span>
            </button>
          </div>

          {/* Tarjetas de Valor / Confianza (Grilla adaptativa de 2 columnas en móvil) */}
          <div id="features" className="pt-8 sm:pt-12 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 max-w-3xl mx-auto text-left">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 sm:p-4 hover:border-slate-700 transition-colors">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 mb-1.5 sm:mb-2" />
              <div className="font-bold text-xs sm:text-sm text-white">Multi-Dominio</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-snug">Subdominios propios y dominios de empresa</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 sm:p-4 hover:border-slate-700 transition-colors">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mb-1.5 sm:mb-2" />
              <div className="font-bold text-xs sm:text-sm text-white">Ventas por Bulto</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-snug">Escalas de precio por fardos, cajas y pallets</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 sm:p-4 hover:border-slate-700 transition-colors">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mb-1.5 sm:mb-2" />
              <div className="font-bold text-xs sm:text-sm text-white">Multi-Sucursal</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-snug">Atención local con WhatsApp por planta o CEDI</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 sm:p-4 hover:border-slate-700 transition-colors">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 mb-1.5 sm:mb-2" />
              <div className="font-bold text-xs sm:text-sm text-white">Aislamiento RLS</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-snug">PostgreSQL 17 con aislamiento por tenant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Casos de Uso (Optimizado Móvil) */}
      <section id="cases" className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
            Agnosticidad Total de Industria
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Empresas y Sectores que Corren en tenddy
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 px-2">
            El mismo motor tecnológico adaptado a las necesidades de cada sector industrial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto">
          {/* Caso 1: Plásticos */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-sky-500/50 transition-all group">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-3 sm:mb-4">
                <span className="text-[11px] sm:text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded">
                  Industria del Plástico & Empaques
                </span>
                <span className="text-[11px] text-slate-500 font-mono">ayme.tenddy.shop</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2">AYME INDUSTRIAS PET</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Catálogo con especificaciones técnicas de inyección y soplado (cuello PCO, gramaje de preforma, capacidad en ml, resistencia a 40 Bar).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
              <Link
                href="/store/ayme-pet"
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center justify-center sm:justify-start gap-1.5 py-1"
              >
                <span>Ver Tienda en Vivo</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/store/ayme-pet/admin"
                className="text-xs font-medium text-slate-400 hover:text-white flex items-center justify-center sm:justify-start gap-1 py-1"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Panel Admin</span>
              </Link>
            </div>
          </div>

          {/* Caso 2: Confitería */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-rose-500/50 transition-all group">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-3 sm:mb-4">
                <span className="text-[11px] sm:text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded">
                  Confitería & Alimentos Mayoristas
                </span>
                <span className="text-[11px] text-slate-500 font-mono">dulcelandia.tenddy.shop</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2">Dulcelandia Chocolates & Gomitas</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Venta mayorista por cajas máster y pallets para distribuidores, cadenas de supermercados y dulcerías con tablas nutricionales y vida útil.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
              <Link
                href="/store/dulcelandia"
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center justify-center sm:justify-start gap-1.5 py-1"
              >
                <span>Ver Tienda de Confitería</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/store/dulcelandia/admin"
                className="text-xs font-medium text-slate-400 hover:text-white flex items-center justify-center sm:justify-start gap-1 py-1"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Panel Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="border-t border-slate-800 bg-slate-900/40 py-12 sm:py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            ¿Listo para llevar tu fábrica o distribuidora al canal digital?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto px-2">
            Crea tu tienda B2B hoy mismo. Recibe cotizaciones formales por WhatsApp y gestiona tus clientes en un panel privado.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
            <Link
              href="/registro"
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm py-3.5 px-8 rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Registrar Mi Empresa Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm py-3.5 px-6 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LifeBuoy className="w-4 h-4 text-amber-400" />
              <span>Contactar Soporte</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer Responsivo */}
      <footer className="border-t border-slate-800 py-6 sm:py-8 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <p>© {new Date().getFullYear()} tenddy — Plataforma B2B Multi-Tenant.</p>
            <VersionBadge className="bg-slate-900 border-slate-800 text-slate-400" />
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-slate-400">
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="hover:text-white cursor-pointer text-xs flex items-center gap-1 py-1"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
              <span>Soporte</span>
            </button>
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="hover:text-white cursor-pointer text-xs py-1"
            >
              Acceso Administrador
            </button>
            <Link href="/registro" className="hover:text-white py-1">Crear Tienda</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
