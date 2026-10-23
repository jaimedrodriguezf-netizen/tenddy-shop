'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  MessageCircle,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  Factory
} from 'lucide-react';
import { buildStorefrontThemeCSS, resolveStorefrontTokens } from '@/lib/theme-tokens';
import { resolveLandingSections, LandingSectionsConfig } from '@/lib/types';

interface AymeLandingProps {
  initialSections?: Partial<LandingSectionsConfig>;
}

export default function AymeCorporateLandingPage({ initialSections }: AymeLandingProps) {
  const sections = resolveLandingSections(initialSections, 'AYME INDUSTRIAS PET', 'ayme-pet');
  const primaryColor = '#A61C2E';
  const secondaryColor = '#8C1625';
  const themeTokens = resolveStorefrontTokens(primaryColor, secondaryColor);
  const themeStyles = buildStorefrontThemeCSS(primaryColor, secondaryColor);

  const [contactName, setContactName] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactProduct, setContactProduct] = useState('Envases PET 500ml');
  const [contactVolume, setContactVolume] = useState('5.000 a 10.000 uds/mes');

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
    <div style={themeStyles} className="min-h-screen bg-[#0a1128] text-slate-100 font-sans selection:bg-[#A61C2E] selection:text-white">
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

        {/* 2. HEADER CORPORATIVO */}
        {sections.header.enabled && (
          <header className={`backdrop-blur-md border-b border-white/10 transition-colors duration-300 ${
            isHeaderSolid ? 'bg-[#0a1128]/98 shadow-xl' : 'bg-[#0a1128]/80'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A61C2E] to-[#8C1625] flex items-center justify-center font-black text-white text-lg shadow-md border border-white/20">
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
              </div>

              {sections.header.show_whatsapp_button && (
                <div className="flex items-center gap-3">
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
                </div>
              )}
            </div>
          </header>
        )}
      </div>

      {/* 3. HERO DE POTENCIA INDUSTRIAL */}
      {sections.hero.enabled && (
        <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 border-b border-white/10 overflow-hidden">
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
                    className="bg-[#A61C2E] hover:bg-[#8C1625] text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-[#A61C2E]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <span>{sections.hero.cta_primary_text || 'Solicitar Muestras & Cotización'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}

                <a
                  href="#procesos"
                  className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl border border-white/15 transition-all"
                >
                  {sections.hero.cta_secondary_text || 'Ver Fases de Fabricación'}
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

      {/* 4. TRES PILARES DE RESPALDO INDUSTRIAL */}
      {sections.pillars.enabled && sections.pillars.items?.length > 0 && (
        <section className="py-12 px-4 sm:px-6 bg-[#060c1d] border-b border-white/10">
          <div className="max-w-7xl mx-auto">
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

      {/* 5. FORMULARIO B2B Y MAPA DE PLANTA */}
      {sections.rfq_and_map.enabled && (
        <section id="cotizar" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Formulario */}
          {sections.rfq_and_map.show_form && (
            <div className="bg-[#060c1d] border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {sections.rfq_and_map.title || 'Solicitud de Cotización & Muestras'}
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

              <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{sections.rfq_and_map.schedule || 'Lunes a Viernes: 08:00 - 17:30'}</span>
                </span>
                <span className="font-mono text-white">{sections.rfq_and_map.email || 'ventas@aymeindustriaspet.com'}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* FOOTER */}
      {sections.footer.enabled && (
        <footer className="border-t border-white/10 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
          <p>{sections.footer.copyright_text || `© ${new Date().getFullYear()} AYME INDUSTRIAS PET. Solutions in Packaging. Todos los derechos reservados.`}</p>
          {sections.footer.show_powered_by && (
            <p className="text-[10px] text-slate-600">Portal corporativo e infraestructura B2B impulsada por tenddy.</p>
          )}
        </footer>
      )}
    </div>
  );
}
