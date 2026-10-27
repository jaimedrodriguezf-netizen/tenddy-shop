'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  MessageCircle,
  ChevronRight,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Factory,
  Menu,
  X,
  ChevronUp,
  Boxes
} from 'lucide-react';
import { buildStorefrontThemeCSS } from '@/lib/theme-tokens';
import { resolveLandingSections, LandingSectionsConfig } from '@/lib/types';

interface AymeLandingProps {
  initialSections?: Partial<LandingSectionsConfig>;
}

// Catálogo oficial de envases y preformas de AYME INDUSTRIAS PET
const AYME_PRODUCTS = [
  {
    id: 'ayme-001',
    name: 'Botella PET 500ml Cilíndrica',
    category: 'Línea Bebidas & Alimentos',
    neck: 'Rosca 28mm PCO 1881',
    weight: '24g / 28g',
    image: '/assets/products/ayme-001.svg',
    formValue: 'Botella PET 500ml',
    description: 'Envase de alta resistencia y transparencia cristal para jugos, aguas, lácteos y vinagres.',
  },
  {
    id: 'ayme-002',
    name: 'Botella PET 1 Litro Estándar',
    category: 'Línea Granel & Líquidos',
    neck: 'Rosca 28mm PCO',
    weight: '32g / 36g',
    image: '/assets/products/ayme-002.svg',
    formValue: 'Botella PET 1 Litro',
    description: 'Diseño anatómico con estrías de compresión vertical para embotellado continuo en planta.',
  },
  {
    id: 'ayme-003',
    name: 'Galón PET 3.8L Industrial',
    category: 'Línea Químicos & Limpieza',
    neck: 'Rosca 38mm / Asa Reforzada',
    weight: '85g - 110g',
    image: '/assets/products/ayme-003.svg',
    formValue: 'Galón PET 3.8 Litros',
    description: 'Garrafa con asa ergonómica reforzada para cloro, detergentes, aceites y desinfectantes.',
  },
  {
    id: 'ayme-004',
    name: 'Botella PET 250ml Cuadrada',
    category: 'Línea Cosmética & Farma',
    neck: 'Rosca 28mm',
    weight: '18g / 22g',
    image: '/assets/products/ayme-004.svg',
    formValue: 'Botella PET 250ml Cuadrada',
    description: 'Formato premium de caras planas ideal para etiquetado frontal completo y termoencogible.',
  },
  {
    id: 'ayme-005',
    name: 'Frasco PET 500ml Boca Ancha',
    category: 'Línea Alimentos & Sólidos',
    neck: 'Rosca 63mm / 70mm',
    weight: '30g / 35g',
    image: '/assets/products/ayme-005.svg',
    formValue: 'Frasco PET 500ml Boca Ancha',
    description: 'Frasco transparente ideal para confitería, salsas espesas, cápsulas y frutos secos.',
  },
  {
    id: 'ayme-006',
    name: 'Botella PET 1.5L Familiar',
    category: 'Línea Bebidas Carbonatadas',
    neck: 'Rosca 28mm PCO',
    weight: '42g',
    image: '/assets/products/ayme-006.svg',
    formValue: 'Botella PET 1.5L Familiar',
    description: 'Base petaloide de alta tolerancia a presiones internas de gasificado y empaque paletizado.',
  },
  {
    id: 'ayme-007',
    name: 'Preformas PET 24g - 42g',
    category: 'Materia Prima Grado Alimento',
    neck: 'Cuello PCO 1881 / 1810',
    weight: '24g a 42g',
    image: '/assets/products/ayme-007.svg',
    formValue: 'Preformas & Tapas',
    description: 'Inyectadas en resina PET 100% virgen certificada para soplado industrial en planta propia.',
  },
  {
    id: 'ayme-008',
    name: 'Tapas de Seguridad y Liners PP',
    category: 'Accesorios & Cierres',
    neck: '28mm / 38mm / 63mm',
    weight: 'Polipropileno Copolímero',
    image: '/assets/products/ayme-008.svg',
    formValue: 'Preformas & Tapas',
    description: 'Cierre hermético con anillo precinto de seguridad inviolable y liners de inducción térmica.',
  },
];

// Fases de fabricación y servicios industriales
const AYME_PROCESSES = [
  {
    step: '01',
    badge: 'SOPLADO & INYECCIÓN',
    title: 'Fabricación y Maquila de Envases PET & PP',
    description: 'Líneas rotativas y lineales de alta velocidad (+12.000 BPH) para abastecimiento masivo continuo con espesores uniformes y cuellos libres de deformación.',
    image: '/assets/services/service-01.webp',
    specs: ['Cadencia: +12.000 BPH', 'Cuellos: 28mm PCO y 38mm', 'Resina 100% virgen'],
    productPreset: 'Botella PET 500ml',
  },
  {
    step: '02',
    badge: 'TAPAS & ACCESORIOS',
    title: 'Suministro de Tapas Inviolables y Liners',
    description: 'Producción de tapas en polipropileno con precinto de seguridad desprendible y liners de inducción electromagnética para hermeticidad absoluta.',
    image: '/assets/services/service-02.webp',
    specs: ['Liners de inducción herméticos', 'Precinto de rotura inviolable', 'Variedad de colores corporativos'],
    productPreset: 'Preformas & Tapas',
  },
  {
    step: '03',
    badge: 'INGENIERÍA DE MOLDES',
    title: 'Matricería 3D y Moldes Personalizados',
    description: 'Departamento propio de diseño paramétrico CAD/CAM y maquinado CNC en aluminio aeronáutico para matrices exclusivas con la identidad de tu marca.',
    image: '/assets/services/service-03.png',
    specs: ['Modelado CAD/CAM 3D', 'Aluminio aeronáutico refrigerado', 'Matriz 1 a 4 cavidades'],
    productPreset: 'Molde Personalizado 3D',
  },
];

export default function AymeCorporateLandingPage({ initialSections }: AymeLandingProps) {
  const sections = resolveLandingSections(initialSections, 'AYME INDUSTRIAS PET', 'ayme-pet');
  const primaryColor = '#A61C2E';
  const secondaryColor = '#8C1625';
  const themeStyles = buildStorefrontThemeCSS(primaryColor, secondaryColor);

  const [contactName, setContactName] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactProduct, setContactProduct] = useState('Botella PET 500ml');
  const [contactVolume, setContactVolume] = useState('5.000 a 10.000 uds/mes');

  // Control de menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Control de Smart Hide y Sólido en Header para AYME
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);

  useEffect(() => {
    let prevY = window.scrollY;

    const handleSmartHeader = () => {
      const currentY = window.scrollY;
      const diff = currentY - prevY;

      if (currentY <= 60) {
        setIsHeaderVisible(true);
        setIsHeaderSolid(false);
      } else {
        setIsHeaderSolid(true);

        if (diff > 8 && currentY > 120) {
          setIsHeaderVisible(false);
        } else if (diff < -6) {
          setIsHeaderVisible(true);
        }
      }

      prevY = currentY;
    };

    window.addEventListener('scroll', handleSmartHeader, { passive: true });
    return () => window.removeEventListener('scroll', handleSmartHeader);
  }, []);

  const mainWhatsapp = '593998722324';
  const displayPhone = '099 872 2324';

  const handleSelectProductAndQuote = (productName: string) => {
    setContactProduct(productName);
    const target = document.getElementById('cotizar');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendRFQ = (e: React.FormEvent) => {
    e.preventDefault();
    let msg = `¡Hola AYME INDUSTRIAS PET!\n\n`;
    msg += `Deseo solicitar una cotización industrial desde su portal oficial:\n`;
    msg += `👤 *Contacto:* ${contactName}\n`;
    msg += `🏢 *Empresa:* ${contactCompany || 'Particular'}\n`;
    msg += `📱 *Teléfono:* ${contactPhone}\n`;
    msg += `📦 *Requerimiento:* ${contactProduct}\n`;
    msg += `📊 *Volumen mensual estimado:* ${contactVolume}\n\n`;
    msg += `Por favor envíenme ficha técnica y disponibilidad de entrega.`;

    const url = `https://wa.me/${mainWhatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="inicio" style={themeStyles} className="min-h-screen bg-[#0a1128] text-slate-100 font-sans selection:bg-[#A61C2E] selection:text-white">
      {/* 1 & 2. CABECERA FLOTANTE CON SMART HIDE (OCULTA AL BAJAR, APARECE AL SUBIR) */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isHeaderSolid ? 'shadow-2xl' : ''
        }`}
        style={{
          transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
          opacity: isHeaderVisible ? 1 : 0,
          pointerEvents: isHeaderVisible ? 'auto' : 'none',
        }}
      >
        {/* 1. TOP PROMO BAR CORPORATIVA */}
        {sections.top_bar.enabled && (
          <div
            style={{ backgroundColor: sections.top_bar.bg_color || '#8C1625' }}
            className="text-white text-[11px] font-bold py-1.5 px-4 text-center border-b border-white/10 flex items-center justify-center gap-2"
          >
            <span>{sections.top_bar.text}</span>
          </div>
        )}

        {/* 2. HEADER CORPORATIVO INTERACTIVO */}
        {sections.header.enabled && (
          <header className={`backdrop-blur-md border-b border-white/10 transition-colors duration-300 ${
            isHeaderSolid ? 'bg-[#0a1128]/98 shadow-xl' : 'bg-[#0a1128]/85'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              {/* Logo y Enlace a Inicio */}
              <a
                href="#inicio"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-3 group transition-transform hover:opacity-95"
                title="AYME INDUSTRIAS PET - Inicio"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A61C2E] to-[#8C1625] flex items-center justify-center font-black text-white text-lg shadow-md border border-white/20 group-hover:scale-105 transition-transform">
                  A
                </div>
                <div>
                  <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">
                    AYME INDUSTRIAS PET
                  </h1>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {sections.header.custom_subtitle || 'Solutions in Packaging • B2B'}
                  </p>
                </div>
              </a>

              {/* Navegación Desktop */}
              <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Inicio
                </button>
                <a href="#procesos" className="hover:text-white transition-colors">
                  Fases de Fabricación
                </a>
                <a href="#catalogo" className="hover:text-white transition-colors">
                  Catálogo de Envases
                </a>
                {sections.pillars.enabled && (
                  <a href="#pilares" className="hover:text-white transition-colors">
                    Garantías & Calidad
                  </a>
                )}
                {sections.rfq_and_map.enabled && (
                  <a href="#cotizar" className="hover:text-white transition-colors">
                    Cotizar & Planta
                  </a>
                )}
              </nav>

              {/* Botón WhatsApp y Alternador Móvil */}
              <div className="flex items-center gap-2 sm:gap-3">
                {sections.header.show_whatsapp_button && (
                  <a
                    href={`https://wa.me/${mainWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">WhatsApp Ventas ({displayPhone})</span>
                    <span className="sm:hidden">Cotizar</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-colors cursor-pointer"
                  aria-label="Abrir menú de navegación"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Menú Drawer Móvil */}
            {isMobileMenuOpen && (
              <div className="lg:hidden bg-[#060c1d]/98 backdrop-blur-xl border-t border-white/10 px-4 py-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 px-3 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white"
                >
                  🏭 Inicio
                </button>
                <a
                  href="#procesos"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 px-3 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white"
                >
                  ⚙️ Fases de Fabricación
                </a>
                <a
                  href="#catalogo"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 px-3 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white"
                >
                  📦 Catálogo de Envases
                </a>
                {sections.pillars.enabled && (
                  <a
                    href="#pilares"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 px-3 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white"
                  >
                    🏆 Garantías & Respaldo
                  </a>
                )}
                {sections.rfq_and_map.enabled && (
                  <a
                    href="#cotizar"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 px-3 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white"
                  >
                    📍 Cotizador & Retiro en Planta
                  </a>
                )}
              </div>
            )}
          </header>
        )}
      </div>

      {/* 3. HERO DE POTENCIA INDUSTRIAL */}
      {sections.hero.enabled && (
        <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 border-b border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-radial from-[#A61C2E]/20 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto relative z-10 space-y-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:gap-10">
            <div className="space-y-4 max-w-2xl">
              {sections.hero.badge && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-yellow-300 text-xs font-mono font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{sections.hero.badge}</span>
                </div>
              )}

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                {sections.hero.title_main || 'TECNOLOGÍA EN'} <br />
                <span className="text-[#A61C2E] underline decoration-yellow-400/50">
                  {sections.hero.title_highlight || 'soplado & inyección'}
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {sections.hero.description}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                {sections.rfq_and_map.enabled && (
                  <a
                    href="#cotizar"
                    className="bg-[#A61C2E] hover:bg-[#8C1625] text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-[#A61C2E]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <span>{sections.hero.cta_primary_text || 'Solicitar Muestras & Cotización'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}

                <a
                  href="#procesos"
                  className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl border border-white/15 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{sections.hero.cta_secondary_text || 'Ver Fases de Fabricación'}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>

                <a
                  href="#catalogo"
                  className="bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl border border-white/10 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-[#A61C2E]" />
                  <span>Ver Catálogo de Envases</span>
                </a>
              </div>
            </div>

            {/* Tarjeta de Telemetría de Planta */}
            {sections.hero.show_telemetry && (
              <div className="mt-8 sm:mt-0 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 sm:w-80 shrink-0 text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Factory className="w-4 h-4 text-emerald-400" />
                    <span>{sections.hero.telemetry_plant_name || 'Planta Calderón'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {sections.hero.telemetry_status || 'Operativa'}
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Cadencia Máxima:</span>
                    <span className="text-white font-bold text-sm">{sections.hero.telemetry_cadence || '+12.000 BPH'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Material Certificado:</span>
                    <span className="text-white font-bold">{sections.hero.telemetry_material || 'Resina PET 100% Virgen'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Matricería CNC:</span>
                    <span className="text-white font-bold">{sections.hero.telemetry_tooling || 'Diseño de Moldes 3D'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECCIÓN DE FASES DE FABRICACIÓN / PROCESOS INDUSTRIALES (#procesos) */}
      <section id="procesos" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-10 border-b border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Factory className="w-3.5 h-3.5" />
            <span>Capacidad y Tecnología Industrial</span>
          </span>
          <h3 className="text-2xl sm:text-4xl font-black text-white">
            Fases de Fabricación & Servicios de Planta
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Desde el diseño paramétrico de matrices y moldes en aluminio aeronáutico hasta el soplado en alta cadencia con resina 100% virgen certificada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AYME_PROCESSES.map((proc) => (
            <div
              key={proc.step}
              className="bg-[#060c1d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-[#A61C2E]/50 transition-colors"
            >
              <div>
                <div className="h-48 relative overflow-hidden bg-slate-900">
                  <img
                    src={proc.image}
                    alt={proc.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border border-white/15">
                    FASE {proc.step} • {proc.badge}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h4 className="font-bold text-base text-white leading-snug">
                    {proc.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {proc.description}
                  </p>

                  <ul className="pt-2 space-y-1.5 text-[11px] text-slate-300 font-mono">
                    {proc.specs.map((sp, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{sp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  type="button"
                  onClick={() => handleSelectProductAndQuote(proc.productPreset)}
                  className="w-full bg-white/10 hover:bg-[#A61C2E] text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-white/15 hover:border-transparent transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Configurar y Cotizar Fase {proc.step}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN DE CATÁLOGO DE ENVASES PET (#catalogo) */}
      <section id="catalogo" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-10 border-b border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Boxes className="w-3.5 h-3.5" />
            <span>Portafolio Industrial Disponible</span>
          </span>
          <h3 className="text-2xl sm:text-4xl font-black text-white">
            Catálogo de Envases, Galones & Preformas
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Modelos de alta rotación para bebidas, farma, agroquímicos y alimentos. Disponibilidad de retiro inmediato por fardo, palet o contenedor.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {AYME_PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              className="bg-[#060c1d] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-[#A61C2E]/60 transition-all group"
            >
              <div>
                <div className="relative aspect-square rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-center p-4 overflow-hidden mb-3">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                  <span className="absolute top-2 right-2 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-black/60 text-slate-300 border border-white/10">
                    B2B • Mayorista
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-red-400 font-bold block">
                    {prod.category}
                  </span>
                  <h4 className="font-bold text-sm text-white group-hover:text-red-300 transition-colors">
                    {prod.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed pt-1">
                    {prod.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 space-y-1 font-mono text-[10px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Rosca:</span>
                    <span className="text-slate-200 font-semibold">{prod.neck}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gramaje:</span>
                    <span className="text-slate-200 font-semibold">{prod.weight}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectProductAndQuote(prod.formValue)}
                  className="w-full bg-[#A61C2E] hover:bg-[#8C1625] text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 cursor-pointer"
                >
                  <span>Cotizar este Envase</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. TRES PILARES DE RESPALDO INDUSTRIAL (#pilares) */}
      {sections.pillars.enabled && sections.pillars.items?.length > 0 && (
        <section id="pilares" className="py-16 px-4 sm:px-6 bg-[#060c1d] border-b border-white/10">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider">
                Garantía y Confianza B2B
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-white">
                Pilares Operativos en Nuestra Planta
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sections.pillars.items.map((item, idx) => (
                <div key={idx} className="bg-[#0a1128] border border-white/10 p-6 rounded-2xl space-y-2">
                  <div className="text-3xl mb-1">{item.icon}</div>
                  <h4 className="text-base font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. FORMULARIO B2B Y MAPA DE PLANTA (#cotizar) */}
      {sections.rfq_and_map.enabled && (
        <section id="cotizar" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Formulario */}
          {sections.rfq_and_map.show_form && (
            <div className="bg-[#060c1d] border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  <span>{sections.rfq_and_map.title || 'Solicitud de Cotización & Muestras'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {sections.rfq_and_map.subtitle || 'Atención directa de fábrica para pedidos por fardo, bulto o contenedor.'}
                </p>
              </div>

              <form onSubmit={handleSendRFQ} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ej: Ing. Carlos Pérez"
                    className="w-full bg-[#0a1128] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#A61C2E]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Empresa / Razón Social:</label>
                  <input
                    type="text"
                    value={contactCompany}
                    onChange={(e) => setContactCompany(e.target.value)}
                    placeholder="Ej: Industrias Alimentarias S.A."
                    className="w-full bg-[#0a1128] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#A61C2E]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp de Contacto:</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Ej: 0991234567"
                    className="w-full bg-[#0a1128] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#A61C2E]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Línea de Envase:</label>
                    <select
                      value={contactProduct}
                      onChange={(e) => setContactProduct(e.target.value)}
                      className="w-full bg-[#0a1128] border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#A61C2E]"
                    >
                      <option value="Botella PET 500ml">Botella PET 500ml</option>
                      <option value="Botella PET 1 Litro">Botella PET 1 Litro</option>
                      <option value="Galón PET 3.8 Litros">Galón PET 3.8 Litros</option>
                      <option value="Botella PET 250ml Cuadrada">Botella PET 250ml Cuadrada</option>
                      <option value="Frasco PET 500ml Boca Ancha">Frasco PET 500ml Boca Ancha</option>
                      <option value="Botella PET 1.5L Familiar">Botella PET 1.5L Familiar</option>
                      <option value="Preformas & Tapas">Preformas & Tapas</option>
                      <option value="Molde Personalizado 3D">Molde Personalizado 3D</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Volumen Mensual:</label>
                    <select
                      value={contactVolume}
                      onChange={(e) => setContactVolume(e.target.value)}
                      className="w-full bg-[#0a1128] border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#A61C2E]"
                    >
                      <option value="1.000 a 5.000 uds/mes">1.000 a 5.000 uds/mes</option>
                      <option value="5.000 a 20.000 uds/mes">5.000 a 20.000 uds/mes</option>
                      <option value="+50.000 uds/mes">+50.000 uds/mes (Mayorista)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#A61C2E] hover:bg-[#8C1625] text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Requerimiento a WhatsApp de Ventas</span>
                </button>
              </form>
            </div>
          )}

          {/* Ubicación y Mapa */}
          {sections.rfq_and_map.show_map && (
            <div className="bg-[#060c1d] border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#A61C2E]" />
                  <span>{sections.rfq_and_map.map_title || 'Ubicación de Planta & Retiro Directo'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sector Calderón - Llano Grande, Quito, Ecuador.
                </p>
              </div>

              <div className="h-72 w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                <iframe
                  title="Ubicación AYME INDUSTRIAS PET"
                  src={sections.rfq_and_map.map_embed_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.816652458428!2d-78.4485!3d-0.0886!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMDUnMTkuMCJTIDc4wrAyNic1NC42Ilc!5e0!3m2!1ses!2sec!4v1620000000000!5m2!1ses!2sec"}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{sections.rfq_and_map.schedule || 'Lunes a Viernes: 08:00 - 17:30'}</span>
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href="tel:+593998722324"
                    className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                    title="Llamar a planta"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#A61C2E]" />
                    <span>099 872 2324</span>
                  </a>
                  <a
                    href={`mailto:${sections.rfq_and_map.email || 'ventas@aymeindustriaspet.com'}`}
                    className="flex items-center gap-1 font-mono text-white hover:text-red-300 transition-colors"
                    title="Enviar correo"
                  >
                    <Mail className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{sections.rfq_and_map.email || 'ventas@aymeindustriaspet.com'}</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* BOTÓN FLOTANTE VOLVER ARRIBA */}
      {isHeaderSolid && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-30 bg-[#A61C2E] hover:bg-[#8C1625] text-white p-3 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 border border-white/20 cursor-pointer"
          aria-label="Volver arriba"
          title="Volver arriba"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* 6. FOOTER INTERACTIVO */}
      {sections.footer.enabled && (
        <footer className="border-t border-white/10 py-10 px-4 text-center text-xs text-slate-400 space-y-4 bg-[#060c1d]">
          <div className="flex flex-wrap justify-center items-center gap-6 text-[11px] font-semibold text-slate-400">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Inicio
            </button>
            <a href="#procesos" className="hover:text-white transition-colors">
              Fases de Fabricación
            </a>
            <a href="#catalogo" className="hover:text-white transition-colors">
              Catálogo de Envases
            </a>
            <a href="#cotizar" className="hover:text-white transition-colors">
              Solicitar Cotización
            </a>
            <a
              href={`https://wa.me/${mainWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              WhatsApp Ventas
            </a>
          </div>

          <p>{sections.footer.copyright_text || `© ${new Date().getFullYear()} AYME INDUSTRIAS PET. Solutions in Packaging. Todos los derechos reservados.`}</p>
          {sections.footer.show_powered_by && (
            <p className="text-[10px] text-slate-600">Portal corporativo e infraestructura B2B impulsada por tenddy.</p>
          )}
        </footer>
      )}
    </div>
  );
}
