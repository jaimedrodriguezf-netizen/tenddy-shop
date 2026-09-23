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
  Zap,
  TrendingUp,
  Cpu
} from 'lucide-react';

export default function PlatformHomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Header Central de la Plataforma */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-blue-700 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20 text-xl">
              T
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-xl text-white tracking-tight">tenddy</span>
              <span className="text-sky-400 font-bold text-base">.shop</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Características B2B</a>
            <a href="#cases" className="hover:text-white transition-colors">Casos de Uso</a>
            <a href="#architecture" className="hover:text-white transition-colors">Arquitectura</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/store/ayme-pet"
              className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-lg transition-colors hidden sm:block"
            >
              Ver Demo en Vivo
            </Link>
            <Link
              href="/registro"
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg shadow-sky-600/30 transition-all flex items-center gap-1.5"
            >
              <span>Crear Tienda B2B</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Principal SaaS */}
      <section className="relative overflow-hidden py-24 md:py-32 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs px-3.5 py-1.5 rounded-full font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Motor SaaS E-Commerce Multi-Tenant B2B
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            El E-Commerce Mayorista para <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">Fabricantes y Distribuidores</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Abandona las tiendas B2C tradicionales. Despliega una plataforma corporativa con cotizaciones por volumen (MOQ), fichas técnicas, ruteo multi-sucursal y pedidos directos a WhatsApp.
          </p>

          <div className="pt-4 flex flex-wrap justify-center items-center gap-4">
            <Link
              href="/registro"
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-xl shadow-sky-600/30 transition-all flex items-center gap-2"
            >
              <span>Crear Tienda Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/store/ayme-pet"
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm px-6 py-3.5 rounded-xl transition-all"
            >
              Explorar Tienda Demo
            </Link>
          </div>

          {/* Badges de Confianza */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <Globe className="w-5 h-5 text-sky-400 mb-2" />
              <div className="font-bold text-sm text-white">Multi-Dominio</div>
              <div className="text-[11px] text-slate-400">Subdominios *.tenddy.shop y dominios propios</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <Package className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="font-bold text-sm text-white">Ventas por Bulto</div>
              <div className="text-[11px] text-slate-400">Escalas de precio por fardos, cajas y pallets</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <Building2 className="w-5 h-5 text-amber-400 mb-2" />
              <div className="font-bold text-sm text-white">Multi-Sucursal</div>
              <div className="text-[11px] text-slate-400">Atención local con WhatsApp por planta o CEDI</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <ShieldCheck className="w-5 h-5 text-cyan-400 mb-2" />
              <div className="font-bold text-sm text-white">Aislamiento RLS</div>
              <div className="text-[11px] text-slate-400">PostgreSQL 17 con seguridad por tenant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Casos de Uso / Tenants Activos */}
      <section id="cases" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
            Agnosticidad Total de Industria
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            Empresas y Sectores que Corren en tenddy.shop
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            El mismo motor tecnológico adaptado a las necesidades de cada sector industrial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Caso 1: Plásticos */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-sky-500/50 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded">
                  Industria del Plástico & Empaques
                </span>
                <span className="text-[11px] text-slate-500 font-mono">ayme.tenddy.shop</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AYME INDUSTRIAS PET</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Catálogo con especificaciones técnicas de inyección y soplado (cuello PCO, gramaje de preforma, capacidad en ml, resistencia a 40 Bar).
              </p>
            </div>
            <Link
              href="/store/ayme-pet"
              className="mt-4 text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1.5"
            >
              <span>Ver Tienda Industrial en Vivo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Caso 2: Confitería */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-rose-500/50 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded">
                  Confitería & Alimentos Mayoristas
                </span>
                <span className="text-[11px] text-slate-500 font-mono">dulcelandia.tenddy.shop</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Dulcelandia Chocolates & Gomitas</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Venta mayorista por cajas máster y pallets para distribuidores, cadenas de supermercados y dulcerías con tablas nutricionales y vida útil.
              </p>
            </div>
            <Link
              href="/store/dulcelandia"
              className="mt-4 text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
            >
              <span>Ver Tienda de Confitería en Vivo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="border-t border-slate-800 bg-slate-900/40 py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            ¿Listo para llevar tu fábrica o distribuidora al canal digital?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Crea tu tienda B2B hoy mismo. Recibe cotizaciones formales por WhatsApp y gestiona tus clientes en un panel privado.
          </p>
          <div className="pt-2">
            <Link
              href="/registro"
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-xl shadow-sky-600/30 transition-all inline-flex items-center gap-2"
            >
              <span>Registrar Mi Empresa Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} tenddy.shop — Plataforma B2B Multi-Tenant.</p>
          <div className="flex gap-6 text-slate-400">
            <Link href="/registro" className="hover:text-white">Crear Tienda</Link>
            <Link href="/store/ayme-pet" className="hover:text-white">Demo Plásticos</Link>
            <Link href="/store/dulcelandia" className="hover:text-white">Demo Confitería</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
