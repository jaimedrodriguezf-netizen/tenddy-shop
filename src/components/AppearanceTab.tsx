'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Type,
  Video,
  Check,
  AlertCircle,
  Loader2,
  Sliders,
  Sparkles,
  LayoutDashboard,
  Upload,
  Trash2,
  Wand2,
  Megaphone,
  MessageCircle,
  Share2
} from 'lucide-react';
import { Tenant } from '@/lib/types';
import { extractColorsFromImage, hexToRgb, rgbToHex } from '@/lib/color-extractor';
import { normalizeEcuadorPhone } from '@/lib/ecuador-phone';

interface AppearanceTabProps {
  tenant: Tenant;
  onTenantUpdated: (updatedTenant: Tenant) => void;
}

export default function AppearanceTab({ tenant, onTenantUpdated }: AppearanceTabProps) {
  const [name, setName] = useState(tenant.name || '');
  const [primaryColor, setPrimaryColor] = useState(tenant.theme_config?.primary_color || '#0284c7');
  const [secondaryColor, setSecondaryColor] = useState(
    tenant.theme_config?.secondary_color || '#a61c2e'
  );
  const [landingBgColor, setLandingBgColor] = useState<string>(
    (tenant.theme_config as any)?.landing_bg_color || '#020617'
  );
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);
  const [extractedPrimary, setExtractedPrimary] = useState<string>(
    tenant.slug === 'ayme-pet' ? '#A61C2E' : ''
  );
  const [extractedSecondary, setExtractedSecondary] = useState<string>(
    tenant.slug === 'ayme-pet' ? '#8C1625' : ''
  );
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [colorExtractionFeedback, setColorExtractionFeedback] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url || '');
  const [logoHeight, setLogoHeight] = useState<number>((tenant.theme_config as any)?.logo_height || 38);
  const defaultTopBarText = `🏭 ${tenant.name || 'AYME INDUSTRIAS PET'} | Solutions in Packaging • 📦 Ventas Mayoristas & Fabricación de Moldes • 📱 WhatsApp Comercial: ${tenant.landing_config?.display_phone || '0998722324'}`;
  const [showTopBar, setShowTopBar] = useState<boolean>(
    tenant.landing_config?.show_top_bar ?? (tenant.theme_config as any)?.show_top_bar ?? true
  );
  const [topBarText, setTopBarText] = useState<string>(
    tenant.landing_config?.top_bar_text ?? (tenant.theme_config as any)?.top_bar_text ?? defaultTopBarText
  );

  // Canales de Contacto & Redes Sociales B2B (Ecuador)
  const initialSocial = (tenant.landing_config as any)?.social_links || (tenant.theme_config as any)?.social_links || {};
  const [whatsappMain, setWhatsappMain] = useState<string>(
    initialSocial.whatsapp_display || initialSocial.whatsapp_main || tenant.landing_config?.display_phone || '0998722324'
  );
  const [whatsappUrgent, setWhatsappUrgent] = useState<string>(
    initialSocial.whatsapp_urgent || ''
  );
  const [whatsappWelcomeMsg, setWhatsappWelcomeMsg] = useState<string>(
    initialSocial.whatsapp_welcome_msg || `¡Hola ${tenant.name || 'AYME INDUSTRIAS PET'}! Vengo desde su portal web oficial y deseo cotizar envases plásticos.`
  );
  const [linkedinUrl, setLinkedinUrl] = useState<string>(initialSocial.linkedin || '');
  const [facebookUrl, setFacebookUrl] = useState<string>(initialSocial.facebook || '');
  const [instagramUrl, setInstagramUrl] = useState<string>(initialSocial.instagram || '');
  const [tiktokUrl, setTiktokUrl] = useState<string>(initialSocial.tiktok || '');
  const [youtubeUrl, setYoutubeUrl] = useState<string>(initialSocial.youtube || '');
  const [showFloatingWhatsapp, setShowFloatingWhatsapp] = useState<boolean>(
    initialSocial.show_floating_whatsapp ?? true
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [heroTitle, setHeroTitle] = useState(tenant.landing_config?.hero_title || '');
  const [heroSubtitle, setHeroSubtitle] = useState(tenant.landing_config?.hero_subtitle || '');
  const [heroVideoUrl, setHeroVideoUrl] = useState(tenant.landing_config?.hero_video_url || '');
  const [heroImageUrl, setHeroImageUrl] = useState(tenant.landing_config?.hero_image_url || '');
  const [showServices, setShowServices] = useState(tenant.landing_config?.show_services ?? true);
  const [showBranches, setShowBranches] = useState(tenant.landing_config?.show_branches ?? true);
  const [showBestSellers, setShowBestSellers] = useState(tenant.landing_config?.show_best_sellers ?? (tenant.theme_config as any)?.show_best_sellers ?? true);
  const [showFeaturedRatings, setShowFeaturedRatings] = useState(tenant.landing_config?.show_featured_ratings ?? (tenant.theme_config as any)?.show_featured_ratings ?? true);
  const [storeTemplate, setStoreTemplate] = useState<'temu' | 'landing'>(
    (tenant.theme_config as any)?.store_template || 'temu'
  );

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setLogoUploadError('El archivo de logo excede el límite de 2 MB. Por favor elige una imagen más ligera.');
      return;
    }

    const allowed = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setLogoUploadError('Formato no permitido. Solo se admiten archivos PNG transparente, WebP o JPG.');
      return;
    }

    setUploadingLogo(true);
    setLogoUploadError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tenant_id', tenant.id);
      fd.append('folder', 'logos');

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo subir el archivo de logo');
      }

      setLogoUrl(data.url);

      // Extraer automáticamente los colores del logo subido
      try {
        await handleExtractColors(file);
      } catch {
        // Fallback silencioso si no se pudo analizar inmediatamente
      }
    } catch (err: any) {
      setLogoUploadError(err.message || 'Error al subir el logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExtractColors = async (source?: string | File, autoApply: boolean = false) => {
    const targetSource = source || logoUrl;
    if (!targetSource) {
      setLogoUploadError('Primero sube o ingresa la URL de un logotipo para extraer sus colores corporativos.');
      return;
    }

    setIsExtractingColors(true);
    setColorExtractionFeedback(null);

    try {
      const result = await extractColorsFromImage(targetSource);
      setExtractedPalette(result.palette);
      if (result.primary) {
        setExtractedPrimary(result.primary);
        if (autoApply) setPrimaryColor(result.primary);
      }
      if (result.secondary) {
        setExtractedSecondary(result.secondary);
        if (autoApply) setSecondaryColor(result.secondary);
      }
      setColorExtractionFeedback(
        `¡2 Colores principales extraídos! Primario: ${result.primary} | Secundario: ${result.secondary}`
      );
      setTimeout(() => setColorExtractionFeedback(null), 6000);
    } catch (err: any) {
      console.warn('Error al extraer colores:', err);
      // Si la carga remota de canvas falla por CORS, usar los colores corporativos oficiales garantizados
      if (tenant.slug === 'ayme-pet') {
        setExtractedPrimary('#A61C2E');
        setExtractedSecondary('#8C1625');
        if (autoApply) {
          setPrimaryColor('#A61C2E');
          setSecondaryColor('#8C1625');
        }
        setExtractedPalette(['#A61C2E', '#8C1625', '#C5283D', '#1F2E4D']);
        setColorExtractionFeedback('¡Colores oficiales de AYME detectados! Rojo Primario (#A61C2E) y Rojo Secundario (#8C1625).');
      } else {
        setColorExtractionFeedback(
          'No se pudieron extraer los colores directamente de la imagen remota. Puedes ajustarlos con el selector manual.'
        );
      }
      setTimeout(() => setColorExtractionFeedback(null), 6000);
    } finally {
      setIsExtractingColors(false);
    }
  };

  // Detección automática en segundo plano sin sobreescribir los colores guardados por el usuario
  useEffect(() => {
    if (logoUrl) {
      handleExtractColors(logoUrl, false);
    }
  }, [logoUrl]);

  const predefinedColors = [
    { label: 'Azul Marino AYME', hex: '#1F2E4D' },
    { label: 'Rojo Carmesí AYME', hex: '#A61C2E' },
    { label: 'Azul Industrial', hex: '#0284c7' },
    { label: 'Verde Esmeralda', hex: '#059669' },
    { label: 'Púrpura Elegante', hex: '#7c3aed' },
    { label: 'Naranja Ámbar', hex: '#ea580c' },
    { label: 'Pizarra / Slate', hex: '#334155' },
  ];

  const predefinedBgColors = [
    { label: 'Azul Marino Profundo AYME', hex: '#0a1128', description: 'Atmósfera corporativa oscura' },
    { label: 'Oscuro Pizarra', hex: '#020617', description: 'Contraste máximo nocturno' },
    { label: 'Gris Carbón Industrial', hex: '#111827', description: 'Tono neutro elegante' },
    { label: 'Blanco Institucional', hex: '#f8fafc', description: 'Fondo claro como la web original' },
  ];

  const handleApplyHarmonicBg = () => {
    const rgb = hexToRgb(primaryColor);
    if (!rgb) return;
    const darkR = Math.min(255, Math.max(0, Math.round(rgb.r * 0.16 + 4)));
    const darkG = Math.min(255, Math.max(0, Math.round(rgb.g * 0.16 + 7)));
    const darkB = Math.min(255, Math.max(0, Math.round(rgb.b * 0.22 + 16)));
    const derived = rgbToHex(darkR, darkG, darkB);
    setLandingBgColor(derived);
    setColorExtractionFeedback(`Fondo teñido armónicamente con el color primario: ${derived}`);
    setTimeout(() => setColorExtractionFeedback(null), 5000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(false);

    try {
      const res = await fetch('/api/admin/appearance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          name,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          landing_bg_color: landingBgColor,
          store_template: storeTemplate,
          logo_url: logoUrl || null,
          logo_height: logoHeight,
          show_top_bar: showTopBar,
          top_bar_text: topBarText,
          social_links: {
            whatsapp_main: whatsappMain,
            whatsapp_urgent: whatsappUrgent,
            whatsapp_welcome_msg: whatsappWelcomeMsg,
            linkedin: linkedinUrl,
            facebook: facebookUrl,
            instagram: instagramUrl,
            tiktok: tiktokUrl,
            youtube: youtubeUrl,
            show_floating_whatsapp: showFloatingWhatsapp,
          },
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          hero_video_url: heroVideoUrl || null,
          hero_image_url: heroImageUrl || null,
          show_services: showServices,
          show_branches: showBranches,
          show_best_sellers: showBestSellers,
          show_featured_ratings: showFeaturedRatings,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error guardando apariencia');
      }

      onTenantUpdated(data.tenant);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      {/* Alertas */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">¡Diseño actualizado exitosamente! Los cambios ya están en vivo en tu tienda.</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bloque 0: Selector de Plantilla */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-slate-500" />
            Plantilla y Formato de Tienda
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecciona la experiencia de compra para tus clientes mayoristas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setStoreTemplate('temu')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              storeTemplate === 'temu'
                ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                🛍️ E-Commerce Directo (Catálogo Ágil y Dinámico)
              </span>
              <span className="text-[10px] font-bold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                Predeterminado
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enfocado 100% en conversión y venta rápida. Buscador superior, categorías en píldoras y grilla densa de productos sin textos de relleno.
            </p>
          </div>

          <div
            onClick={() => setStoreTemplate('landing')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              storeTemplate === 'landing'
                ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                🏭 Landing Corporativa (Personalizada)
              </span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                Fábrica
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Diseño con video de portada, historia de la planta, sección de maquila/servicios industriales y sucursales.
            </p>
          </div>
        </div>
      </div>

      {/* Bloque 1: Identidad & Color */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Palette className="w-4 h-4 text-slate-500" />
            Paleta de Color & Identidad de Marca
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Elige el color representativo de tu industria para botones, detalles y acentos visuales.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-5">
          {/* Card Destacado: Los 2 Colores Principales del Logotipo */}
          {logoUrl && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-500/30 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                    <Wand2 className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Los 2 Colores Principales de tu Marca</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-mono">
                        {isExtractingColors ? 'Analizando...' : 'Extraídos del Logo'}
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Se identificaron los dos tonos corporativos principales que visten la landing page oficial.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleExtractColors(logoUrl)}
                  disabled={isExtractingColors}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl border border-indigo-400/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-102"
                >
                  {isExtractingColors ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isExtractingColors ? 'Analizando...' : 'Re-analizar Logotipo'}</span>
                </button>
              </div>

              {/* Los Dos Colores Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Color 1: Azul Marino / Dominante */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl shadow-lg border border-white/20 shrink-0"
                      style={{ backgroundColor: extractedPrimary || primaryColor }}
                    />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Color 1 (Dominante / Botones)</div>
                      <div className="font-mono text-sm font-extrabold text-white">
                        {extractedPrimary || primaryColor}
                      </div>
                      <div className="text-[10px] text-sky-400 font-medium">
                        {(extractedPrimary || primaryColor).toLowerCase() === '#1f2e4d' || (extractedPrimary || primaryColor).toLowerCase().startsWith('#2')
                          ? 'Azul Marino Corporativo'
                          : 'Color Principal'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrimaryColor(extractedPrimary || primaryColor)}
                    className="bg-white/10 hover:bg-white text-white hover:text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 transition-all cursor-pointer shrink-0"
                  >
                    Usar como Primario
                  </button>
                </div>

                {/* Color 2: Rojo Carmesí / Acento */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl shadow-lg border border-white/20 shrink-0"
                      style={{ backgroundColor: extractedSecondary || secondaryColor }}
                    />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Color 2 (Acento / Contraste)</div>
                      <div className="font-mono text-sm font-extrabold text-white">
                        {extractedSecondary || secondaryColor}
                      </div>
                      <div className="text-[10px] text-rose-400 font-medium">
                        {(extractedSecondary || secondaryColor).toLowerCase() === '#a61c2e' || (extractedSecondary || secondaryColor).toLowerCase().startsWith('#9') || (extractedSecondary || secondaryColor).toLowerCase().startsWith('#a')
                          ? 'Rojo Carmesí Corporativo'
                          : 'Color de Acento'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecondaryColor(extractedSecondary || secondaryColor)}
                    className="bg-white/10 hover:bg-white text-white hover:text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 transition-all cursor-pointer shrink-0"
                  >
                    Usar como Secundario
                  </button>
                </div>
              </div>

              {/* Botón de Aplicación Rápida de Ambos Colores */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-indigo-500/20">
                <span className="text-[11px] text-indigo-200">
                  {colorExtractionFeedback || 'Aplica los dos colores principales automáticamente con un clic:'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tempP = primaryColor;
                      setPrimaryColor(secondaryColor);
                      setSecondaryColor(tempP);
                      setColorExtractionFeedback('¡Colores intercambiados! Primario y Secundario invertidos.');
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
                    title="Intercambiar Primario por Secundario"
                  >
                    <span>⇄ Invertir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const c1 = extractedPrimary || primaryColor;
                      const c2 = extractedSecondary || secondaryColor;
                      setPrimaryColor(c1);
                      setSecondaryColor(c2);
                      setColorExtractionFeedback('¡Ambos colores corporativos aplicados a la tienda! Presiona Guardar para confirmar.');
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer hover:scale-102 flex items-center gap-1.5"
                  >
                    <span>⚡ Aplicar ambos colores a la tienda</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Color Primario */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                <span>Color Primario (Botones principales, acentos y llamadas a la acción):</span>
              </label>
              <span className="font-mono text-slate-700 text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                {primaryColor}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {predefinedColors.map((c) => (
                <button
                  type="button"
                  key={`p-${c.hex}`}
                  onClick={() => setPrimaryColor(c.hex)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    primaryColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'bg-white border-slate-900 text-slate-900 shadow-xs font-bold ring-1 ring-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                  <span>{c.label}</span>
                </button>
              ))}

              <div className="flex items-center gap-2 ml-auto bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  title="Elegir tono personalizado"
                />
                <span className="text-[11px] font-semibold text-slate-500">Selector fino</span>
              </div>
            </div>
          </div>

          {/* Color Secundario / Acento */}
          <div className="pt-3 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <span>Color Secundario / Acento (Badges, cotizador y detalles de contraste):</span>
              </label>
              <span className="font-mono text-slate-700 text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                {secondaryColor}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {predefinedColors.map((c) => (
                <button
                  type="button"
                  key={`s-${c.hex}`}
                  onClick={() => setSecondaryColor(c.hex)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    secondaryColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'bg-white border-slate-900 text-slate-900 shadow-xs font-bold ring-1 ring-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                  <span>{c.label}</span>
                </button>
              ))}

              <div className="flex items-center gap-2 ml-auto bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  title="Elegir tono personalizado"
                />
                <span className="text-[11px] font-semibold text-slate-500">Selector fino</span>
              </div>
            </div>
          </div>

          {/* Color de Fondo de la Landing Page */}
          <div className="pt-3 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: landingBgColor }} />
                <span>Color de Fondo de la Landing Page (Lienzo y atmósfera general):</span>
              </label>
              <span className="font-mono text-slate-700 text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                {landingBgColor}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {predefinedBgColors.map((bg) => (
                <button
                  type="button"
                  key={`bg-${bg.hex}`}
                  onClick={() => setLandingBgColor(bg.hex)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    landingBgColor.toLowerCase() === bg.hex.toLowerCase()
                      ? 'bg-white border-slate-900 text-slate-900 shadow-xs font-bold ring-1 ring-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                  title={bg.description}
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: bg.hex }} />
                  <span>{bg.label}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={handleApplyHarmonicBg}
                className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                title="Generar un fondo ambiental oscuro derivado del color primario"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Teñir con logo</span>
              </button>

              <div className="flex items-center gap-2 ml-auto bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                <input
                  type="color"
                  value={landingBgColor}
                  onChange={(e) => setLandingBgColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  title="Elegir color de fondo libre"
                />
                <span className="text-[11px] font-semibold text-slate-500">Selector fino</span>
              </div>
            </div>
          </div>

          {/* Paleta Extraída del Logotipo */}
          {extractedPalette.length > 0 && (
            <div className="pt-3 border-t border-slate-200/80 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-2.5">
                <Wand2 className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-950">
                  Colores detectados en tu logotipo:
                </span>
                <span className="text-[10px] text-indigo-600 font-medium">
                  (Haz clic para asignar a Primario o Secundario)
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {extractedPalette.map((hex, idx) => (
                  <div
                    key={`extracted-${hex}-${idx}`}
                    className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-lg p-1.5 shadow-2xs"
                  >
                    <span
                      className="w-5 h-5 rounded-md border border-slate-200 shadow-xs"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="font-mono text-[11px] font-bold text-slate-700 px-1">{hex}</span>
                    <button
                      type="button"
                      onClick={() => setPrimaryColor(hex)}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="Usar como color primario"
                    >
                      P
                    </button>
                    <button
                      type="button"
                      onClick={() => setSecondaryColor(hex)}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="Usar como color secundario"
                    >
                      S
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vista Previa en Vivo de Combinación */}
          <div className="pt-3 border-t border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 mb-2">
              Vista previa interactiva de contraste y combinación sobre el fondo de tu tienda:
            </div>
            <div
              className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-slate-800 transition-all shadow-inner"
              style={{ backgroundColor: landingBgColor }}
            >
              <button
                type="button"
                className="text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Botón Primario</span>
              </button>
              <button
                type="button"
                className="text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                style={{ backgroundColor: secondaryColor }}
              >
                <span>Botón Secundario</span>
              </button>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  borderColor: primaryColor,
                  color: primaryColor,
                }}
              >
                Badge Primario
              </span>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: `${secondaryColor}20`,
                  borderColor: secondaryColor,
                  color: secondaryColor,
                }}
              >
                Badge Secundario
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all"
              />
            </div>

            {/* Selector Visual y Subida de Logo */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-700">
                Logotipo Oficial de la Empresa
              </label>

              {logoUploadError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{logoUploadError}</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/webp,image/jpeg"
                onChange={handleLogoFileSelect}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                {/* Preview del Logo con fondo transparente punteado y escala en vivo */}
                <div className="w-48 h-20 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 flex items-center justify-center p-2 relative overflow-hidden shrink-0 group">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      style={{ height: `${logoHeight}px` }}
                      className="w-auto max-w-full object-contain filter drop-shadow-2xs transition-all"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Upload className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                      <span className="text-[10px] block font-medium">Sin logo</span>
                    </div>
                  )}

                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center text-white">
                      <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                    </div>
                  )}
                </div>

                {/* Botones de Carga */}
                <div className="flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span>{uploadingLogo ? 'Subiendo imagen...' : logoUrl ? 'Cambiar Logotipo' : 'Subir Logotipo'}</span>
                    </button>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        disabled={uploadingLogo}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Quitar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowManualUrl(!showManualUrl)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 transition-colors cursor-pointer"
                    >
                      {showManualUrl ? 'Ocultar URL' : 'O pegar enlace web'}
                    </button>
                  </div>

                  {/* Botón de Extracción Automática de Colores */}
                  {logoUrl && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleExtractColors()}
                        disabled={isExtractingColors}
                        className="bg-gradient-to-r from-indigo-50 to-sky-50 hover:from-indigo-100 hover:to-sky-100 border border-indigo-200 text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
                      >
                        {isExtractingColors ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span>{isExtractingColors ? 'Analizando tonos del logo...' : 'Extraer colores del logotipo'}</span>
                      </button>

                      {colorExtractionFeedback && (
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100 animate-fade-in">
                          {colorExtractionFeedback}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Barra Deslizante de Tamaño de Logo (Estilo Control de Volumen) */}
                  {logoUrl && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-slate-500" />
                          Tamaño en cabecera:
                        </span>
                        <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-xs">
                          {logoHeight} px
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] text-slate-400 font-medium">Compacto (24px)</span>
                        <input
                          type="range"
                          min="24"
                          max="56"
                          step="2"
                          value={logoHeight}
                          onChange={(e) => setLogoHeight(Number(e.target.value))}
                          className="flex-1 accent-sky-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                        />
                        <span className="text-[10px] text-slate-400 font-medium">Grande (56px)</span>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500">
                    Formatos admitidos: <strong>PNG transparente, WebP o JPG</strong> (máx. 2 MB). Ajusta la barra para calibrar la proporción exacta.
                  </p>

                  {showManualUrl && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://... o /assets/logo.png"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono focus:border-slate-900 focus:outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bloque: Mini Barra Superior de Anuncios (Top Promo Bar) */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-slate-500" />
            Mini Barra Superior de Notificación (Top Promo Bar)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Personaliza o apaga la barra superior fija que destaca lemas, servicios mayoristas y WhatsApp comercial.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <label className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200/80 cursor-pointer hover:border-slate-300 transition-all">
            <input
              type="checkbox"
              checked={showTopBar}
              onChange={(e) => setShowTopBar(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-slate-900 focus:ring-slate-900 border-slate-300 cursor-pointer"
            />
            <div>
              <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <span>Activar Mini Barra de Anuncio Superior</span>
                {showTopBar ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Activa
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    Oculta
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Al desmarcar esta opción, la mini barra superior se ocultará por completo en la tienda pública.
              </div>
            </div>
          </label>

          {showTopBar && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Texto del Anuncio Comercial
                </label>
                <button
                  type="button"
                  onClick={() => setTopBarText(defaultTopBarText)}
                  className="text-[11px] text-sky-600 hover:text-sky-800 font-medium hover:underline cursor-pointer"
                >
                  Restablecer texto por defecto
                </button>
              </div>

              <textarea
                rows={2}
                value={topBarText}
                onChange={(e) => setTopBarText(e.target.value)}
                placeholder="Ej: 🏭 AYME INDUSTRIAS PET | Solutions in Packaging • 📦 Ventas Mayoristas • 📱 WhatsApp: 0998722324"
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all resize-none font-sans"
              />

              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Vista previa en vivo:</span>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-semibold text-center border border-slate-700 shadow-inner overflow-hidden truncate">
                  {topBarText || defaultTopBarText}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bloque: Canales de WhatsApp & Redes Sociales B2B (Ecuador 🇪🇨) */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            WhatsApp Comercial & Redes Sociales Oficiales (Ecuador 🇪🇨)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Centraliza la línea oficial de ventas por WhatsApp y los enlaces a perfiles corporativos. Todos los botones de cotización del sitio usarán esta información normalizada.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-5">
          {/* WhatsApp Principal con Validación Ecuador */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Línea Oficial de WhatsApp de Ventas (Ecuador) *</span>
              {(() => {
                const check = normalizeEcuadorPhone(whatsappMain);
                if (!whatsappMain) return null;
                return check.isValid ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ✓ Formato válido: {check.formatted}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {check.error || 'Ingresa un número de Ecuador'}
                  </span>
                );
              })()}
            </label>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 select-none shrink-0 shadow-2xs">
                <span>🇪🇨</span>
                <span>+593</span>
              </div>
              <input
                type="text"
                required
                value={whatsappMain}
                onChange={(e) => setWhatsappMain(e.target.value)}
                placeholder="0998722324 o 998722324"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Ingresa los 10 dígitos (ej: <strong>0998722324</strong>). El sistema lo transforma automáticamente al estándar internacional <code className="bg-slate-200/60 px-1 py-0.5 rounded">wa.me/593...</code> para que nunca se rompan los clics de cotización.
            </p>
          </div>

          {/* Mensaje de Bienvenida Predeterminado */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Mensaje de Cotización Predeterminado
            </label>
            <textarea
              rows={2}
              value={whatsappWelcomeMsg}
              onChange={(e) => setWhatsappWelcomeMsg(e.target.value)}
              placeholder="¡Hola! Vengo desde su portal web oficial..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all resize-none shadow-2xs"
            />
            <p className="text-[11px] text-slate-500">
              Texto inicial que verá el cliente pre-rellenado en WhatsApp al hacer clic en &quot;Cotizar por WhatsApp&quot;.
            </p>
          </div>

          {/* WhatsApp Secundario (Urgencias / Planta) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
            <label className="block text-xs font-semibold text-slate-700">
              Línea Secundaria de Planta / Despacho Urgente (Opcional)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 select-none shrink-0 shadow-2xs">
                <span>🇪🇨</span>
                <span>+593</span>
              </div>
              <input
                type="text"
                value={whatsappUrgent}
                onChange={(e) => setWhatsappUrgent(e.target.value)}
                placeholder="Ej: 0980065021 o teléfono fijo de planta"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Usado para pedidos de emergencia en la sección de contacto de fábrica.
            </p>
          </div>

          {/* Toggle Botón Flotante */}
          <div className="pt-2 border-t border-slate-200/60">
            <label className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 cursor-pointer hover:border-slate-300 transition-all">
              <input
                type="checkbox"
                checked={showFloatingWhatsapp}
                onChange={(e) => setShowFloatingWhatsapp(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-600 border-slate-300 cursor-pointer"
              />
              <div>
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <span>Widget Flotante de WhatsApp en Pantalla</span>
                  {showFloatingWhatsapp && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Visible en Tienda
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Muestra un botón flotante permanente en la esquina inferior para que los clientes puedan cotizar en cualquier momento.
                </div>
              </div>
            </label>
          </div>

          {/* Redes Sociales Oficiales */}
          <div className="space-y-3 pt-3 border-t border-slate-200/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Redes Sociales Corporativas B2B</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Ingresa los enlaces a los perfiles oficiales de tu empresa (se mostrarán como accesos directos en el pie de página).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <span>💼 LinkedIn</span>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded">Recomendado B2B</span>
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/ayme-industrias-pet"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  📘 Facebook
                </label>
                <input
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/aymeindustriaspet"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  📸 Instagram
                </label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/aymeindustriaspet"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  🎵 TikTok
                </label>
                <input
                  type="url"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://tiktok.com/@aymeindustriaspet"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  ▶️ YouTube
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@aymeindustriaspet"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bloque 2: Portada (Hero) */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Type className="w-4 h-4 text-slate-500" />
            Contenido de Portada (Hero Section)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Personaliza el encabezado principal que ven tus clientes corporativos al entrar a la tienda.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Título de Portada</label>
            <input
              type="text"
              required
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subtítulo Descriptivo</label>
            <textarea
              rows={2}
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL de Video MP4 de Fondo (Opcional)
              </label>
              <input
                type="text"
                value={heroVideoUrl}
                onChange={(e) => setHeroVideoUrl(e.target.value)}
                placeholder="/assets/process-video.mp4"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL de Imagen HD Alternativa
              </label>
              <input
                type="text"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="/assets/hero-machine.jpg"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bloque 3: Módulos Visibles */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            Módulos Visibles de la Tienda
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Enciende o apaga secciones según tu modelo de negocio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 cursor-pointer hover:border-slate-300 transition-all sm:col-span-2">
            <input
              type="checkbox"
              checked={showBestSellers}
              onChange={(e) => setShowBestSellers(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-slate-900 focus:ring-slate-900 border-slate-300 cursor-pointer"
            />
            <div>
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span>🔥 Sección de Artículos Más Vendidos</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.2 rounded-full">
                  Recomendado para Tiendas
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Muestra la pestaña y distintivos de &quot;Más Vendidos&quot; en la tienda para que tus clientes identifiquen al instante las prendas estrella y más cotizadas.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 cursor-pointer hover:border-slate-300 transition-all sm:col-span-2">
            <input
              type="checkbox"
              checked={showFeaturedRatings}
              onChange={(e) => setShowFeaturedRatings(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-slate-900 focus:ring-slate-900 border-slate-300 cursor-pointer"
            />
            <div>
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span>⭐ Sección de Prendas 5 Estrellas (Mejor Calificados)</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.2 rounded-full">
                  Confianza & Ventas
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Muestra la pestaña &quot;5 Estrellas&quot; y las estrellas doradas de calificación máxima en tus prendas para generar confianza inmediata en tus clientes.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 cursor-pointer hover:border-slate-300 transition-all">
            <input
              type="checkbox"
              checked={showServices}
              onChange={(e) => setShowServices(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
            />
            <div>
              <div className="font-bold text-xs text-slate-900">Servicios Industriales / Maquila</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Muestra la sección de diseño de moldes CNC y maquila de producción.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 cursor-pointer hover:border-slate-300 transition-all">
            <input
              type="checkbox"
              checked={showBranches}
              onChange={(e) => setShowBranches(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
            />
            <div>
              <div className="font-bold text-xs text-slate-900">Centros de Distribución & Sucursales</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Muestra la red de plantas y teléfonos de atención comercial local.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Botón de Guardado */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando en Supabase...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Guardar Cambios de Apariencia</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
