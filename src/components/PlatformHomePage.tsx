'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Globe,
  Building2,
  Lock,
  ChevronDown,
  LogOut,
  Store,
  Plus,
  LayoutDashboard,
  Check,
  HelpCircle,
  Calculator,
  MessageSquare,
  FileSpreadsheet,
  Boxes,
  FileCheck,
  Menu,
  X
} from 'lucide-react';
import AdminLoginModal from './AdminLoginModal';
import VersionBadge from './VersionBadge';
import { supabase } from '@/lib/supabase';

interface UserSessionInfo {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  storeSlug?: string | null;
  storeName?: string | null;
}

const FAQ_ITEMS = [
  {
    question: '¿Puedo conectar mi propio dominio (.com o .ec)?',
    answer:
      'Totalmente. Al registrarte obtenés un subdominio gratuito inmediato (ej: tuempresa.tenddy.shop), y desde la Torre de Control podés vincular tu dominio corporativo propio apuntando un registro CNAME sin costo adicional.',
  },
  {
    question: '¿Cobran comisiones sobre los pedidos o ventas?',
    answer:
      'No. Tenddy no cobra ninguna comisión por transacción ni retiene pagos. La relación comercial con tus clientes mayoristas y la forma de pago (transferencia, cheque, crédito o contraentrega) es 100% tuya y directa.',
  },
  {
    question: '¿Cómo funciona la cotización y envío a WhatsApp?',
    answer:
      'A diferencia del retail minorista, los clientes B2B seleccionan volúmenes por fardos o pallets. El sistema calcula la escala de precios por volumen (MOQ), arma la orden formal con especificaciones y la despacha al número de WhatsApp de la sucursal o vendedor correspondiente.',
  },
  {
    question: '¿Puedo gestionar múltiples sucursales, plantas o CEDIs?',
    answer:
      'Sí. Podés registrar cada una de tus plantas o centros de distribución con sus datos de contacto y número de WhatsApp propio. Cuando un cliente cotiza, el sistema le permite elegir la sucursal de retiro o despacho más cercana.',
  },
  {
    question: '¿Qué sectores industriales se adaptan mejor a Tenddy?',
    answer:
      'Cualquier empresa que venda por bulto: fabricantes de envases plásticos, distribuidoras de alimentos, fábricas textiles, químicos, ferretería mayorista y distribuidores que requieran fichas técnicas, lotes y volúmenes mínimos.',
  },
];

export default function PlatformHomePage() {
  const router = useRouter();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserSessionInfo | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Estado para la demostración interactiva B2B
  const [demoBoxes, setDemoBoxes] = useState(50);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Cargar sesión de usuario en portada
  React.useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data?.authenticated && data?.user) {
          setUserInfo(data.user);
        }
      } catch {
        // Ignorar
      }
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await fetch('/api/auth/logout', { method: 'POST' });
    setUserInfo(null);
    setIsUserMenuOpen(false);
    router.refresh();
  };

  // Detección automática en caso de retorno con hash de tokens OAuth
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          router.push('/registro');
        }
      });
    }
  }, [router]);

  // Cálculo de precios mayoristas por volumen en el mockup demo
  const getUnitPrice = (boxes: number) => {
    if (boxes >= 200) return 0.85; // Pallet completo
    if (boxes >= 50) return 0.98;  // Escala media
    return 1.20;                   // Escala base
  };

  const currentUnitPrice = getUnitPrice(demoBoxes);
  const totalDemoPrice = (demoBoxes * 24 * currentUnitPrice).toFixed(2); // 24 unidades por caja
  const discountPercent =
    demoBoxes >= 200 ? 29 : demoBoxes >= 50 ? 18 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Modales */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* Header Central de la Plataforma */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo y Marca */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-blue-700 flex items-center justify-center font-bold text-white shadow-md shadow-sky-500/20 text-base sm:text-xl">
              T
            </div>
            <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">tenddy</span>
          </Link>

          {/* Navegación Desktop con scroll-margin ajustado */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">Cómo Funciona</a>
            <a href="#demo" className="hover:text-white transition-colors">Demostración B2B</a>
            <a href="#features" className="hover:text-white transition-colors">Características</a>
            <a href="#faq" className="hover:text-white transition-colors">Preguntas Frecuentes</a>
          </nav>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {userInfo ? (
              /* Usuario Autenticado */
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                  title="Opciones de cuenta"
                >
                  {userInfo.avatarUrl ? (
                    <Image
                      src={userInfo.avatarUrl}
                      alt={userInfo.name}
                      width={32}
                      height={32}
                      unoptimized
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                      {userInfo.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="text-left hidden sm:block">
                    <span className="block text-xs font-bold text-white truncate max-w-[120px]">
                      {userInfo.name}
                    </span>
                    <span className="block text-[10px] text-sky-400 font-medium">
                      {userInfo.storeName || 'Mi Tienda'}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown del Usuario */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 text-xs space-y-1">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <span className="block font-bold text-white truncate">{userInfo.name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono truncate">{userInfo.email}</span>
                    </div>

                    {userInfo.storeSlug ? (
                      <>
                        <Link
                          href={`/store/${userInfo.storeSlug}/admin`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-sky-400" />
                          <span>Mi Panel de Tienda</span>
                        </Link>
                        <Link
                          href={`/store/${userInfo.storeSlug}`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <Store className="w-4 h-4 text-slate-400" />
                          <span>Ver Catálogo Público</span>
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/registro"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sky-400 hover:bg-slate-800 transition-colors font-semibold"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Crear Mi Tienda B2B</span>
                      </Link>
                    )}

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Usuario No Autenticado */
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Acceso al panel administrativo de tu tienda"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Acceso Administrador</span>
                <span className="sm:hidden text-[11px]">Admin</span>
              </button>
            )}

            {/* Botón Principal */}
            {userInfo?.storeSlug ? (
              <Link
                href={`/store/${userInfo.storeSlug}/admin`}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-md shadow-sky-600/30 transition-all flex items-center gap-1.5 shrink-0"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mi Panel</span>
                <span className="sm:hidden text-[11px]">Panel</span>
              </Link>
            ) : (
              <Link
                href="/registro"
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-md shadow-sky-600/30 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span className="hidden sm:inline">Crear Tienda B2B</span>
                <span className="sm:hidden text-[11px]">Crear Tienda</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Botón Menú Móvil */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
              aria-label="Abrir menú"
            >
              {isMobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {isMobileNavOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-800/80 px-2 space-y-2 text-sm bg-slate-950/95 pb-2">
            <a
              href="#how-it-works"
              onClick={() => setIsMobileNavOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              Cómo Funciona
            </a>
            <a
              href="#demo"
              onClick={() => setIsMobileNavOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              Demostración B2B
            </a>
            <a
              href="#features"
              onClick={() => setIsMobileNavOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              Características
            </a>
            <a
              href="#faq"
              onClick={() => setIsMobileNavOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              Preguntas Frecuentes
            </a>
          </div>
        )}
      </header>

      {/* Hero Principal SaaS */}
      <section className="relative overflow-hidden py-12 sm:py-20 md:py-28 border-b border-slate-800">
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

          {/* Botones de Acción */}
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
            <Link
              href="/registro"
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm py-3.5 px-8 rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Crear Tienda Gratis</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#demo"
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Boxes className="w-4 h-4 text-sky-400" />
              <span>Ver Demostración B2B</span>
            </a>
          </div>

          {/* Badges de Confianza Rápidos */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Sin comisiones por venta</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Cotización directa por WhatsApp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Soporte para dominios propios</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 1: Cómo Funciona en 3 Pasos */}
      <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-24 border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Flujo Simple y Efectivo
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-1">
              Cómo Funciona Tenddy para tu Empresa
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 px-2">
              Transformá el proceso tradicional de ventas por catálogo PDF o mensajes desordenados en un canal corporativo automatizado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Paso 1 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 font-extrabold text-lg flex items-center justify-center mb-5">
                  1
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Creá tu Fábrica o Tienda</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Registrá tu empresa en 2 minutos con Google. Asignás tu subdominio (ej: <code className="text-sky-300 font-mono text-xs">tumarca.tenddy.shop</code>) y configurás tus colores y logo de marca.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Compatible con dominios .com y .ec</span>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold text-lg flex items-center justify-center mb-5">
                  2
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Cargá Escalas y Fichas</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Definí mínimos de compra (MOQ), precios decrecientes por fardo o pallet, especificaciones técnicas (gramaje, boca, material) y variantes de producto.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                <span>Importación masiva Excel/CSV soportada</span>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-lg flex items-center justify-center mb-5">
                  3
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Cotizaciones a WhatsApp</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Tus compradores arman su pedido por volumen y el sistema envía una orden estructurada al WhatsApp del asesor de ventas o CEDI seleccionado.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ruteo inteligente por sucursal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: Demostración Interactiva B2B (Mockup en Vivo) */}
      <section id="demo" className="scroll-mt-24 py-16 sm:py-24 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Experiencia del Comprador Mayorista
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-1">
              Probá Cómo Cotiza tu Cliente B2B
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 px-2">
              Mirá cómo se calculan los precios por volumen de forma automática y cómo se genera la orden para WhatsApp.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Columna Izquierda: Información del Producto B2B */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Envase PET Industrial
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    SKU: PET-GAL-3785
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  Envase Galón 3785ml con Tapa Rosca Seguridad
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Envase de alta resistencia para productos químicos, alimenticios y de limpieza. Aprobado para contacto con alimentos. Presentación en cajas de 24 unidades.
                </p>

                {/* Especificaciones Técnicas */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                    <span className="text-slate-500 text-[10px] block">Material</span>
                    <span className="font-bold text-slate-200">Resina PET Virgen</span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                    <span className="text-slate-500 text-[10px] block">Boca / Cuello</span>
                    <span className="font-bold text-slate-200">PCO 1881 (28mm)</span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                    <span className="text-slate-500 text-[10px] block">Gramaje</span>
                    <span className="font-bold text-slate-200">120g ± 2g</span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                    <span className="text-slate-500 text-[10px] block">Resistencia</span>
                    <span className="font-bold text-slate-200">35 PSI Presión</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
                  <FileCheck className="w-4 h-4 shrink-0" />
                  <span>Ficha técnica oficial descargable disponible</span>
                </div>
              </div>

              {/* Columna Derecha: Calculadora Interactiva de Escala Mayorista */}
              <div className="lg:col-span-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Cotizador por Volumen
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    MOQ: 10 Cajas
                  </span>
                </div>

                {/* Escalas de Precios */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-400 font-medium mb-1">Escalas de precio configuradas:</div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div
                      onClick={() => setDemoBoxes(10)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        demoBoxes < 50
                          ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px]">10 a 49 cajas</div>
                      <div className="text-sm font-extrabold text-white">$1.20 <span className="text-[9px] font-normal text-slate-400">/u</span></div>
                    </div>
                    <div
                      onClick={() => setDemoBoxes(50)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        demoBoxes >= 50 && demoBoxes < 200
                          ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px]">50 a 199 cajas</div>
                      <div className="text-sm font-extrabold text-white">$0.98 <span className="text-[9px] font-normal text-slate-400">/u</span></div>
                      <span className="text-[9px] text-emerald-400 font-bold">-18%</span>
                    </div>
                    <div
                      onClick={() => setDemoBoxes(200)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        demoBoxes >= 200
                          ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px]">Pallet (200+)</div>
                      <div className="text-sm font-extrabold text-white">$0.85 <span className="text-[9px] font-normal text-slate-400">/u</span></div>
                      <span className="text-[9px] text-emerald-400 font-bold">-29%</span>
                    </div>
                  </div>
                </div>

                {/* Selector de Cantidad */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 font-medium mb-1.5">
                    <span>Cantidad a Cotizar:</span>
                    <span className="font-bold text-white">{demoBoxes} Cajas ({demoBoxes * 24} Unidades)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDemoBoxes((prev) => Math.max(10, prev - 10))}
                      className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min={10}
                      max={300}
                      step={10}
                      value={demoBoxes}
                      onChange={(e) => setDemoBoxes(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                    <button
                      onClick={() => setDemoBoxes((prev) => Math.min(500, prev + 10))}
                      className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Resumen de Cotización */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Precio unitario aplicado:</span>
                    <span className="font-bold text-white">${currentUnitPrice.toFixed(2)} USD</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Descuento por escala:</span>
                      <span>-{discountPercent}%</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-white pt-1.5 border-t border-slate-800">
                    <span>Total Estimado:</span>
                    <span className="text-sky-400">${totalDemoPrice} USD</span>
                  </div>
                </div>

                {/* Botón Simulado WhatsApp */}
                <div className="pt-1">
                  <div className="w-full bg-emerald-600/90 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
                    <MessageSquare className="w-4 h-4" />
                    <span>Cotización Lista para WhatsApp (Planta Norte)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block text-center mt-1.5">
                    El mensaje se envía preformateado con SKU, volumen y datos de planta
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: Características B2B */}
      <section id="features" className="scroll-mt-24 py-16 sm:py-24 border-b border-slate-800 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Arquitectura de Grado Corporativo
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-1">
              Potencia SaaS Diseñada para Mayoristas
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 px-2">
              Todo lo que una fábrica o importador necesita sin el sobrecosto de desarrollo a medida.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <Globe className="w-6 h-6 text-sky-400 mb-3" />
              <h3 className="font-bold text-sm text-white mb-1">Multi-Dominio y Subdominios</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Asigná subdominios automáticos instantáneos o conectá tu propio dominio corporativo con SSL gestionado.
              </p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <Package className="w-6 h-6 text-emerald-400 mb-3" />
              <h3 className="font-bold text-sm text-white mb-1">Ventas por Bulto y MOQ</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configurá pedidos mínimos y escalas por cajas máster, fardos o pallets completos con precios decrecientes.
              </p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <Building2 className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="font-bold text-sm text-white mb-1">Multi-Sucursal & CEDI</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Asigná números de WhatsApp y puntos de despacho independientes según la planta o bodega que atienda la zona.
              </p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <ShieldCheck className="w-6 h-6 text-cyan-400 mb-3" />
              <h3 className="font-bold text-sm text-white mb-1">Seguridad con Aislamiento RLS</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Base de datos PostgreSQL con Row Level Security estricto. Cada tenant opera con aislamiento absoluto de datos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: Preguntas Frecuentes (FAQ) */}
      <section id="faq" className="scroll-mt-24 py-16 sm:py-24 border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Dudas Comunes</span>
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-1">
              Preguntas Frecuentes sobre Tenddy
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Todo lo que necesitás saber sobre la plataforma antes de dar de alta tu empresa.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <span className="font-bold text-sm sm:text-base text-white">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-sky-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer Responsivo */}
      <footer className="py-8 sm:py-12 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <p>© {new Date().getFullYear()} tenddy — Plataforma B2B Multi-Tenant.</p>
            <VersionBadge className="bg-slate-900 border-slate-800 text-slate-400" />
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-slate-400">
            <a href="#how-it-works" className="hover:text-white py-1 transition-colors">Cómo Funciona</a>
            <a href="#demo" className="hover:text-white py-1 transition-colors">Demostración</a>
            <a href="#features" className="hover:text-white py-1 transition-colors">Características</a>
            <a href="#faq" className="hover:text-white py-1 transition-colors">FAQ</a>
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="hover:text-white cursor-pointer text-xs py-1 transition-colors"
            >
              Acceso Administrador
            </button>
            <Link href="/registro" className="hover:text-white py-1 transition-colors">Crear Tienda</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
