'use client';

import React, { useState } from 'react';
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
  LayoutDashboard
} from 'lucide-react';
import { Tenant } from '@/lib/types';

interface AppearanceTabProps {
  tenant: Tenant;
  onTenantUpdated: (updatedTenant: Tenant) => void;
}

export default function AppearanceTab({ tenant, onTenantUpdated }: AppearanceTabProps) {
  const [name, setName] = useState(tenant.name || '');
  const [primaryColor, setPrimaryColor] = useState(tenant.theme_config?.primary_color || '#0284c7');
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url || '');
  const [heroTitle, setHeroTitle] = useState(tenant.landing_config?.hero_title || '');
  const [heroSubtitle, setHeroSubtitle] = useState(tenant.landing_config?.hero_subtitle || '');
  const [heroVideoUrl, setHeroVideoUrl] = useState(tenant.landing_config?.hero_video_url || '');
  const [heroImageUrl, setHeroImageUrl] = useState(tenant.landing_config?.hero_image_url || '');
  const [showServices, setShowServices] = useState(tenant.landing_config?.show_services ?? true);
  const [showBranches, setShowBranches] = useState(tenant.landing_config?.show_branches ?? true);
  const [storeTemplate, setStoreTemplate] = useState<'temu' | 'landing'>(
    (tenant.theme_config as any)?.store_template || 'temu'
  );

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const predefinedColors = [
    { label: 'Azul Marino', hex: '#1e3a8a' },
    { label: 'Azul Industrial', hex: '#0284c7' },
    { label: 'Rojo Carmesí', hex: '#e11d48' },
    { label: 'Verde Esmeralda', hex: '#059669' },
    { label: 'Púrpura Elegante', hex: '#7c3aed' },
    { label: 'Naranja Ámbar', hex: '#ea580c' },
    { label: 'Pizarra / Slate', hex: '#334155' },
  ];

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
          store_template: storeTemplate,
          logo_url: logoUrl || null,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          hero_video_url: heroVideoUrl || null,
          hero_image_url: heroImageUrl || null,
          show_services: showServices,
          show_branches: showBranches,
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

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Color Primario:</label>
            <div className="flex flex-wrap gap-2 items-center">
              {predefinedColors.map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setPrimaryColor(c.hex)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    primaryColor === c.hex
                      ? 'bg-white border-slate-900 text-slate-900 shadow-xs font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                  <span>{c.label}</span>
                </button>
              ))}

              <div className="flex items-center gap-2 ml-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-slate-700 text-xs font-bold">{primaryColor}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL del Logotipo (PNG / SVG transparente)
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/assets/logo.png"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-all"
              />
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
