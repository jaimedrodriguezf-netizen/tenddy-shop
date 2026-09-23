'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Globe,
  Sparkles,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Loader2,
  Package,
  Layers,
  Phone,
  Mail,
  MapPin,
  Lock
} from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';

export default function RegisterTenantView() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [industryType, setIndustryType] = useState('plastics');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0284c7');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ redirectUrl: string; adminUrl: string; slug: string } | null>(null);

  const handleNameChange = (val: string) => {
    setCompanyName(val);
    if (!slug || slug === formatSlug(companyName)) {
      setSlug(formatSlug(val));
    }
  };

  const formatSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 25);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/tenants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          slug,
          industryType,
          city,
          address,
          whatsapp,
          email,
          primaryColor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la tienda B2B');
      }

      setSuccessData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Header Corporativo */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg text-lg">
              T
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">tenddy</span>
              <span className="text-sky-400 font-bold text-sm">.shop</span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {successData ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                ¡Plataforma B2B Creada con Éxito!
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
                Bienvenido a tenddy.shop
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Tu tienda B2B ya está activa en la base de datos con su catálogo base, sucursal comercial y enrutamiento inteligente.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-w-md mx-auto text-left space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Tu Dominio Oficial:</span>
                <span className="text-sky-400 font-bold">{successData.slug}.tenddy.shop</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Ruta Local / Store:</span>
                <span className="text-slate-300 font-bold">/store/{successData.slug}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Link
                href={successData.redirectUrl}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-6 py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
              >
                <Globe className="w-4 h-4" />
                Ver Mi Tienda Pública
              </Link>
              <Link
                href={successData.adminUrl}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                Entrar a Mi Panel de Control
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Onboarding B2B Multi-Tenant
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Crea la Tienda Mayorista de tu Empresa
              </h1>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">
                Despliega en minutos un e-commerce B2B con catálogo técnico, cotizador en fardos/cajas, WhatsApp comercial y panel de administración propio.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
              {/* Botón Acceso Rápido con Google */}
              <div className="space-y-3 pb-6 border-b border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  Registro Rápido con Cuenta Corporativa
                </span>
                <GoogleSignInButton
                  redirectTo="/registro"
                  label="Registrarse con Google Workspace"
                />
                <div className="relative text-center my-3">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
                  <span className="relative bg-slate-900 px-3 text-[11px] text-slate-500 font-semibold uppercase">O completa los datos manuales</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bloque 1: Empresa & Dominio */}
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-400" />
                      Identidad Corporativa & Subdominio
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Nombre de la Empresa o Fábrica *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Ej. Distribuidora Central de Empaques S.A."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Subdominio Deseado en tenddy.shop *
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          required
                          value={slug}
                          onChange={(e) => setSlug(formatSlug(e.target.value))}
                          placeholder="miempresa"
                          className="w-full bg-slate-950 border border-slate-700 rounded-l-lg px-3 py-2.5 text-xs text-sky-400 font-mono focus:border-sky-500 focus:outline-none text-right"
                        />
                        <span className="bg-slate-800 border border-l-0 border-slate-700 text-slate-400 text-xs px-3 py-2.5 rounded-r-lg font-mono">
                          .tenddy.shop
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selección de Industria */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      Sector Industrial o Giro de Negocio *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'plastics', name: 'Plásticos & Envases', icon: '♳', color: '#0284c7' },
                        { id: 'confectionery', name: 'Confitería & Alimentos', icon: '🍬', color: '#e11d48' },
                        { id: 'chemicals', name: 'Químicos & Agro', icon: '🧪', color: '#059669' },
                        { id: 'cosmetics', name: 'Cosmética & Belleza', icon: '🧴', color: '#7c3aed' },
                        { id: 'hardware', name: 'Ferretería & Construcción', icon: '⚙️', color: '#ea580c' },
                        { id: 'general', name: 'Mayorista General B2B', icon: '📦', color: '#4f46e5' },
                      ].map((ind) => (
                        <div
                          key={ind.id}
                          onClick={() => {
                            setIndustryType(ind.id);
                            setPrimaryColor(ind.color);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                            industryType === ind.id
                              ? 'bg-slate-900 border-sky-500 text-white shadow-md shadow-sky-500/10'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xl">{ind.icon}</span>
                          <span className="text-xs font-semibold">{ind.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bloque 2: Contacto & Sucursal Principal */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      Canales de Atención & Ubicación
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        WhatsApp Comercial (Con código de país) *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                        <input
                          type="tel"
                          required
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="Ej. 593998722324 o 573129876543"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Correo Electrónico de Ventas
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ventas@miempresa.com"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Ciudad Principal de Operación *
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Ej. Quito / Bogotá / Guayaquil"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Dirección de Planta o Bodega Central
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej. Parque Industrial Módulo 4"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón de Envío */}
                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creando Plataforma y Base de Datos...</span>
                      </>
                    ) : (
                      <>
                        <span>Crear Tienda B2B en tenddy.shop</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-500 text-center mt-2.5">
                    Sin tarjeta de crédito requerida. Aprovisionamiento automático en PostgreSQL 17.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
