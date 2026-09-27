'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Globe,
  Sparkles,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Loader2,
  Phone,
  MapPin,
  Lock,
  ShieldCheck,
  LogOut,
  Palette
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import GoogleSignInButton from './GoogleSignInButton';

export default function RegisterTenantView() {
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [industryType, setIndustryType] = useState('plastics');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0284c7');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ redirectUrl: string; adminUrl: string; slug: string } | null>(null);

  // 1. Verificar si el usuario ya está autenticado con Google
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          const name = user.user_metadata?.full_name || user.email.split('@')[0];
          setCurrentUser({ email: user.email, name });
        }
      } catch (err) {
        console.error('Error verificando sesión de Google:', err);
      } finally {
        setCheckingAuth(false);
      }
    }
    loadUser();
  }, []);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMsg('Debes iniciar sesión con Google para crear tu tienda');
      return;
    }

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
          email: currentUser.email,
          creatorName: currentUser.name,
          primaryColor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la tienda B2B');
      }

      setSuccessData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setErrorMsg(msg);
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
        {checkingAuth ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-xs text-slate-400">Verificando sesión segura...</p>
          </div>
        ) : successData ? (
          /* Pantalla de Éxito */
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
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
                Tu tienda B2B ya está activa con tu cuenta de Google vinculada como Administrador Principal.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-w-md mx-auto text-left space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Tu Dominio Oficial:</span>
                <span className="text-sky-400 font-bold">{successData.slug}.tenddy.shop</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Ruta Directa:</span>
                <span className="text-slate-300 font-bold">/store/{successData.slug}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Link
                href={successData.redirectUrl}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
              >
                <Globe className="w-4 h-4" />
                Ver Mi Tienda Pública
              </Link>
              <Link
                href={successData.adminUrl}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                Entrar a Mi Panel de Control
              </Link>
            </div>
          </div>
        ) : !currentUser ? (
          /* PASO 1: ÚNICAMENTE LOGIN CON GOOGLE */
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Paso 1 de 2 • Verificación de Titular
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Crea la Tienda Mayorista de tu Empresa
              </h1>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Para garantizar la seguridad de tu fábrica y vincular la titularidad de tu catálogo, primero identifícate con tu cuenta de Google.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-white">Acceso Seguro con Google</h2>
                <p className="text-xs text-slate-400">
                  Sin contraseñas adicionales. Tu cuenta de Google será la clave maestra para administrar tu tienda.
                </p>
              </div>

              {/* Único botón de acción */}
              <div className="pt-2">
                <GoogleSignInButton
                  redirectTo="/registro"
                  label="Continuar con Google Workspace"
                />
              </div>

              <div className="pt-4 border-t border-slate-800/80 text-left space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Titularidad y propiedad garantizada</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sin recordar ni perder contraseñas</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Activación inmediata de subdominio propio</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* PASO 2: FORMULARIO DE DATOS CORPORATIVOS TRAS ESTAR AUTENTICADO */
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                <CheckCircle className="w-3.5 h-3.5" />
                Paso 2 de 2 • Datos de tu Empresa
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Configura tu Catálogo Mayorista
              </h1>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">
                Ingresa los datos comerciales de tu fábrica para generar tu e-commerce y catálogo técnico en minutos.
              </p>
            </div>

            {/* Barra de Usuario Verificado */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{currentUser.name}</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                      Google Verificado
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{currentUser.email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar sesión y usar otra cuenta de Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cambiar cuenta</span>
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
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
                        placeholder="Ej. Envases Andinos S.A.S"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Subdominio en tenddy.shop *
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          required
                          value={slug}
                          onChange={(e) => setSlug(formatSlug(e.target.value))}
                          placeholder="miempresa"
                          className="w-full bg-slate-950 border border-slate-700 rounded-l-xl px-3.5 py-2.5 text-xs text-sky-400 font-mono focus:border-sky-500 focus:outline-none text-right"
                        />
                        <span className="bg-slate-800 border border-l-0 border-slate-700 text-slate-400 text-xs px-3.5 py-2.5 rounded-r-xl font-mono">
                          .tenddy.shop
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Sector / Industria Principal *
                    </label>
                    <select
                      value={industryType}
                      onChange={(e) => setIndustryType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                    >
                      <option value="plastics">Plásticos & Empaques Industriales (PET, PEAD, Tapas)</option>
                      <option value="confectionery">Alimentos, Confitería & Chocolatería Mayorista</option>
                      <option value="cosmetics">Cosmética, Químicos & Envases Especializados</option>
                      <option value="textiles">Textil, Dotaciones & Confección al por mayor</option>
                      <option value="hardware">Ferretería, Metalmecánica & Construcción</option>
                      <option value="general">Distribución Mayorista / Manufactura General</option>
                    </select>
                  </div>
                </div>

                {/* Bloque 2: Contacto & Operación */}
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      Canal Comercial de Cotización
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        WhatsApp Comercial (Con código de país) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="Ej. +573129876543"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Aquí llegarán los pedidos y cotizaciones automáticas.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Ciudad de la Sede / Planta *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ej. Bogotá, Lima, Medellín..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Dirección de Planta o Despacho Principal
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej. Zona Industrial Calle 15 # 45-20"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloque 3: Color de Marca */}
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Palette className="w-4 h-4 text-sky-400" />
                      Color Primario de tu Tienda
                    </h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <div className="flex flex-wrap gap-2">
                      {['#0284c7', '#10b981', '#6366f1', '#e11d48', '#f59e0b', '#0f172a'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPrimaryColor(c)}
                          className="w-7 h-7 rounded-full border-2 transition-all cursor-pointer"
                          style={{
                            backgroundColor: c,
                            borderColor: primaryColor === c ? '#ffffff' : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !slug || !companyName}
                  className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando tienda y aprovisionando catálogo...</span>
                    </>
                  ) : (
                    <>
                      <span>Crear Mi Tienda B2B Ahora</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
