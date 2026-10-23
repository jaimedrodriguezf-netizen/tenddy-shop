'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Package,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ShoppingCart,
  Plus,
  Eye,
  LayoutDashboard,
  Search,
  Menu,
  X,
  User,
  SlidersHorizontal,
  LogOut,
  Play,
  Pause
} from 'lucide-react';
import Link from 'next/link';
import { Tenant, Branch, Category, Product, resolveLandingSections, getPackagingUnit } from '@/lib/types';
import { useCartStore } from '@/lib/store/cart';
import CartDrawer from '@/components/CartDrawer';
import VersionBadge from '@/components/VersionBadge';
import { normalizeEcuadorPhone, buildEcuadorWhatsAppUrl } from '@/lib/ecuador-phone';

function safeExternalUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

interface TenantLandingViewProps {
  tenant: Tenant;
  categories: Category[];
  products: Product[];
  branches: Branch[];
  isAdmin?: boolean;
}

export default function TenantLandingView({
  tenant,
  categories,
  products,
  branches,
  isAdmin = false,
}: TenantLandingViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCapacity, setSelectedCapacity] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<Branch>(branches[0] || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLLIElement | null>(null);
  const adminMenuRef = useRef<HTMLDivElement | null>(null);

  // Motor de Secuencia de Scroll Interactiva (Hero Dinámico)
  const trackRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [frameIndex, setFrameIndex] = useState<number>(1);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const scrollToPhase = (targetProgressRatio: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const trackTop = rect.top + scrollTop;
    const totalScrollable = rect.height - window.innerHeight;
    if (totalScrollable <= 0) return;
    const targetScroll = trackTop + totalScrollable * targetProgressRatio;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  // Formulario de Contacto B2B
  const [contactName, setContactName] = useState<string>('');
  const [contactCompany, setContactCompany] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactCity, setContactCity] = useState<string>('');
  const [contactReqType, setContactReqType] = useState<string>('Cotización General de Envases');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [isSubmittingContact, setIsSubmittingContact] = useState<boolean>(false);
  const formRenderedAt = useRef<number>(0);

  useEffect(() => {
    formRenderedAt.current = Date.now();
  }, []);

  // Modal Interactivo de Requerimiento Técnico de Servicios Industriales
  const [activeServiceModal, setActiveServiceModal] = useState<{
    id: string;
    title: string;
    tag: string;
  } | null>(null);
  const [serviceOptionType, setServiceOptionType] = useState<string>('Botella PET Estándar');
  const [serviceCapacity, setServiceCapacity] = useState<string>('500 ml');
  const [serviceVolume, setServiceVolume] = useState<string>('5.000 a 10.000 uds/mes');
  const [serviceCustomerName, setServiceCustomerName] = useState<string>('');
  const [serviceCustomerCompany, setServiceCustomerCompany] = useState<string>('');
  const [serviceCustomerPhone, setServiceCustomerPhone] = useState<string>('');
  const [serviceNotes, setServiceNotes] = useState<string>('');

  const { openCart, addItem, getTotalUnits, getTotalPackages } = useCartStore();

  const { landing_config: landing, theme_config: theme } = tenant;
  const logoHeight = (theme as any)?.logo_height || 42;

  // Canales de Contacto & Redes Sociales Oficiales
  const aymePhoneFallback = tenant.slug === 'ayme-pet' ? '0998722324' : '';
  const social = (landing as any)?.social_links || (theme as any)?.social_links || {};
  const rawWhatsapp = social.whatsapp_main || selectedBranch?.phone_whatsapp || landing.whatsapp_default || (tenant as any)?.phone_number || aymePhoneFallback;
  const { international: mainWhatsapp, display: displayPhone } = normalizeEcuadorPhone(rawWhatsapp);
  const urgentWhatsapp = social.whatsapp_urgent ? normalizeEcuadorPhone(social.whatsapp_urgent).international : mainWhatsapp;
  const defaultQuoteSubject = tenant.industry_type === 'plastics' || tenant.slug === 'ayme-pet' ? 'envases plásticos' : 'productos';
  const defaultWelcomeMsg = social.whatsapp_welcome_msg || `¡Hola ${tenant.name}! Vengo desde su portal web oficial y deseo cotizar ${defaultQuoteSubject}.`;

  const totalCartUnits = getTotalUnits(tenant.id);
  const totalCartPackages = getTotalPackages(tenant.id);

  // Fallbacks y valores corporativos centralizados (desacoplamiento de ternarios dispersos)
  const isAyme = tenant.slug === 'ayme-pet';
  const heroTag = tenant.slug === 'ayme-pet' ? 'AYME INDUSTRIAS PET • PACKAGING' : `${tenant.name.toUpperCase()} • B2B`;
  const tenantDefaults = useMemo(() => ({
    plantLocation: landing.plant_location || landing.address || (isAyme ? 'Llano Grande, Quito' : 'Ecuador'),
    address: landing.address || (isAyme ? 'Llano Grande, Sector Calderón, Quito - Ecuador' : (tenant as any)?.address || 'Ecuador'),
    email: landing.email || (tenant as any)?.email || (isAyme ? 'ventas@aymeindustriaspet.com' : `info@${tenant.slug}.com`),
    subtitle: (landing as any)?.subtitle || (isAyme ? 'Solutions in Packaging' : tenant.industry_type || 'Comercio & Fabricación B2B'),
    urgentProductType: isAyme || tenant.industry_type === 'plastics' ? 'envases PET' : 'productos',
    contactReqLabel: isAyme || tenant.industry_type === 'plastics' ? 'Tipo de Envase o Servicio Requerido' : 'Tipo de Requerimiento',
    contactOptions: isAyme || tenant.industry_type === 'plastics'
      ? [
          { value: 'Cotización General de Envases', label: '📦 Cotización General de Envases' },
          { value: 'Fabricación de Molde Personalizado', label: '📐 Fabricación de Molde Personalizado 3D' },
          { value: 'Solicitud de Muestras Físicas', label: '🧪 Solicitud de Kit de Muestras Físicas' },
          { value: 'Maquila de Soplado en Volumen', label: '🏭 Maquila de Soplado en Alto Volumen' },
        ]
      : [
          { value: 'Cotización Mayorista de Productos', label: '📦 Cotización Mayorista de Productos' },
          { value: 'Pedidos Especiales y Personalizados', label: '📐 Pedidos Especiales y Personalizados' },
          { value: 'Solicitud de Muestras Comerciales', label: '🧪 Solicitud de Muestras Comerciales' },
          { value: 'Distribución y Despacho Masivo', label: '🏭 Distribución y Despacho Masivo' },
        ],
  }), [tenant, landing, isAyme]);

  // Motor de Secciones Modulares de la Landing Personalizada
  const sections = useMemo(() =>
    resolveLandingSections(landing.sections, tenant.name, tenant.slug),
  [landing.sections, tenant.name, tenant.slug]);

  // Unidad de Empaque Dinámica
  const packagingUnit = useMemo(() => getPackagingUnit(tenant), [tenant]);

  // Colores corporativos configurados
  const primaryColor = theme?.primary_color || '#A61C2E';
  const secondaryColor = theme?.secondary_color || '#8C1625';
  const landingBgColor = (theme as any)?.landing_bg_color || (tenant.slug === 'ayme-pet' ? '#0a1128' : '#020617');

  // Control dinámico de la mini barra superior (Top Promo Bar)
  const showTopBar = sections.top_bar.enabled && (landing.show_top_bar ?? (theme as any)?.show_top_bar ?? true);
  const customTopBarText = sections.top_bar.text || (landing.top_bar_text ?? (theme as any)?.top_bar_text);

  // Detección de contraste inteligente según luminancia del fondo
  const isLightBg = (() => {
    const hex = landingBgColor.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
    }
    return false;
  })();

  // Control de Smart Hide y Fondo Sólido Opaco para AYME (Evita traslúcido sobre productos)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);

  useEffect(() => {
    let prevY = window.scrollY;

    const handleSmartHeader = () => {
      const currentY = window.scrollY;
      const diff = currentY - prevY;

      // 1. En el Hero (<= 60px): visible y con transparencia original sobre el video
      if (currentY <= 60) {
        setIsHeaderVisible(true);
        setIsHeaderSolid(false);
      } else {
        // 2. Fuera de la portada: fondo sólido opaco siempre para que los productos no se trasluzcan
        setIsHeaderSolid(true);

        // 3. Scroll hacia abajo (explorando catálogo): ocultar header suavemente hacia arriba
        if (diff > 8 && currentY > 120) {
          setIsHeaderVisible(false);
          setIsProductsDropdownOpen(false);
        }
        // 4. Scroll hacia arriba (quiere volver al menú, carrito o cotizar): reaparecer al instante
        else if (diff < -6) {
          setIsHeaderVisible(true);
        }
      }

      prevY = currentY;
    };

    window.addEventListener('scroll', handleSmartHeader, { passive: true });
    return () => window.removeEventListener('scroll', handleSmartHeader);
  }, []);

  // Listener para la Secuencia de Scroll con Lerp continuo a 60fps optimizado
  useEffect(() => {
    let currentProgress = 0;
    let targetProgress = 0;
    let rafId: number | null = null;

    const calculateProgress = () => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Optimización de rendimiento: silenciar bucle si el track está fuera del viewport
      if (rect.bottom < 0) {
        targetProgress = 1;
        return;
      }
      if (rect.top > windowHeight) {
        targetProgress = 0;
        return;
      }

      const totalScrollable = rect.height - windowHeight;
      if (totalScrollable <= 0) return;
      const scrolled = -rect.top;
      targetProgress = Math.max(0, Math.min(1, scrolled / totalScrollable));
    };

    const tick = () => {
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) < 0.001) {
        currentProgress = targetProgress;
        rafId = null;
      } else {
        currentProgress += diff * 0.35;
        rafId = requestAnimationFrame(tick);
      }
      setScrollProgress(currentProgress);
      const fIndex = Math.min(144, Math.max(1, Math.floor(currentProgress * 143) + 1));
      setFrameIndex(fIndex);
    };

    const onScroll = () => {
      calculateProgress();
      // Solo encender rAF si hay diferencia de progreso pendiente (ahorra CPU fuera del Hero)
      if (!rafId && Math.abs(targetProgress - currentProgress) >= 0.001) {
        rafId = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Cálculo de opacidades y traslaciones de las tarjetas del Hero interactivo
  // Fase 0: Intro (0.0 a 0.22)
  const introOpacity = scrollProgress <= 0.22
    ? (scrollProgress > 0.12 ? Math.max(0, Math.min(1, (0.22 - scrollProgress) / 0.10)) : 1)
    : 0;
  const introTranslate = (1 - introOpacity) * -25;

  // Fase 1: Control Térmico (0.22 a 0.58)
  const step1Opacity = (scrollProgress >= 0.22 && scrollProgress <= 0.58)
    ? (scrollProgress < 0.32 ? (scrollProgress - 0.22) / 0.10 : (scrollProgress > 0.48 ? (0.58 - scrollProgress) / 0.10 : 1))
    : 0;
  const step1Translate = (1 - step1Opacity) * 25;

  // Fase 2: Soplado (0.58 a 0.98)
  const step2Opacity = (scrollProgress >= 0.58 && scrollProgress <= 0.98)
    ? (scrollProgress < 0.68 ? (scrollProgress - 0.58) / 0.10 : (scrollProgress > 0.88 ? (0.98 - scrollProgress) / 0.10 : 1))
    : 0;
  const step2Translate = (1 - step2Opacity) * 25;

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductsDropdownOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bloqueo de scroll de fondo y tecla Escape para modales interactivos (WCAG 2.1)
  useEffect(() => {
    const isModalOpen = Boolean(activeServiceModal);
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveServiceModal(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeServiceModal]);

  // Filtrar productos con límite progresivo (escalabilidad de DOM para catálogos masivos)
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [prevFilters, setPrevFilters] = useState<string>(`${selectedCategory}_${selectedCapacity}`);
  const currentFilters = `${selectedCategory}_${selectedCapacity}`;
  if (prevFilters !== currentFilters) {
    setPrevFilters(currentFilters);
    setVisibleCount(24);
  }

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const normalizeSearchToken = (str: string) => str.toLowerCase().replace(/[\s\-_.]/g, '');
    const normTargetCap = selectedCapacity !== 'all' ? normalizeSearchToken(selectedCapacity) : '';

    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
      if (!matchesCategory) return false;

      // Matching inteligente y tolerante de capacidades industriales (ej: 500ml = 500 ml, 1000ml = 1L)
      if (selectedCapacity !== 'all') {
        const specs = p.attributes?.specs || {};
        const normSpecsCap = specs.capacidad ? normalizeSearchToken(String(specs.capacidad)) : '';
        const normName = normalizeSearchToken(p.name);

        const matchesCap =
          normSpecsCap.includes(normTargetCap) ||
          normName.includes(normTargetCap) ||
          (normTargetCap === '1000ml' && (normSpecsCap.includes('1l') || normName.includes('1l') || normName.includes('1litro'))) ||
          (normTargetCap === '4000ml' && (normSpecsCap.includes('4l') || normSpecsCap.includes('galon') || normName.includes('4l') || normName.includes('galon')));

        if (!matchesCap) return false;
      }

      if (!query) return true;

      const specs = p.attributes?.specs || {};
      const nameMatch = p.name.toLowerCase().includes(query);
      const descMatch = p.description?.toLowerCase().includes(query) ?? false;
      const skuMatch = p.sku?.toLowerCase().includes(query) ?? false;
      const specsMatch = Object.values(specs).some((val) =>
        (typeof val === 'string' || typeof val === 'number') &&
        String(val).toLowerCase().includes(query)
      );
      return nameMatch || descMatch || skuMatch || specsMatch;
    });
  }, [products, selectedCategory, selectedCapacity, searchQuery]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  // Helper centralizado para registrar leads de cotización en Supabase (/api/quotes)
  const persistLeadQuote = (params: {
    customerName: string;
    companyName?: string;
    phone?: string;
    city?: string;
    notes: string;
    productName: string;
    renderedAt?: number;
  }) => {
    try {
      fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          branch_id: selectedBranch?.id || branches[0]?.id || null,
          customer_name: params.customerName.trim() || 'Cliente B2B',
          company_name: params.companyName?.trim() || undefined,
          customer_phone: params.phone?.trim() || 'No proporcionado',
          delivery_city: params.city?.trim() || undefined,
          notes: params.notes.trim(),
          items: [
            {
              name: params.productName,
              product_name: params.productName,
              units_per_package: 1,
              packages_count: 1,
              total_units: 1,
            },
          ],
          _form_rendered_at: params.renderedAt,
        }),
      }).catch((err) => console.error('Error no bloqueante al registrar lead:', err));
    } catch {
      // Ignorar para garantizar la redirección del cliente
    }
  };

  const handleServiceModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeServiceModal) return;

    let msg = `🏭 *SOLICITUD DE SERVICIO INDUSTRIAL - ${tenant.name.toUpperCase()}*\n\n`;
    msg += `⚙️ *Servicio:* ${activeServiceModal.title}\n`;
    msg += `📦 *Tipo de Requerimiento:* ${serviceOptionType}\n`;
    msg += `📏 *Capacidad / Boca:* ${serviceCapacity}\n`;
    msg += `📊 *Volumen Estimado:* ${serviceVolume}\n`;
    if (serviceCustomerName.trim()) msg += `👤 *Contacto:* ${serviceCustomerName.trim()}\n`;
    if (serviceCustomerCompany.trim()) msg += `🏢 *Empresa:* ${serviceCustomerCompany.trim()}\n`;
    if (serviceCustomerPhone.trim()) msg += `📱 *Teléfono:* ${serviceCustomerPhone.trim()}\n`;
    if (serviceNotes.trim()) msg += `📝 *Notas / Requerimiento:* ${serviceNotes.trim()}\n`;

    // Persistir lead de servicio de forma asíncrona
    persistLeadQuote({
      customerName: serviceCustomerName,
      companyName: serviceCustomerCompany,
      phone: serviceCustomerPhone,
      notes: `Servicio: ${activeServiceModal.title} - ${serviceOptionType} (${serviceCapacity}) - Vol: ${serviceVolume}. ${serviceNotes}`,
      productName: `Servicio: ${activeServiceModal.title}`,
    });

    const url = buildEcuadorWhatsAppUrl(mainWhatsapp, msg);
    setActiveServiceModal(null);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppQuote = (productName?: string) => {
    let msg = defaultWelcomeMsg;
    if (productName) {
      msg += `\n\n📦 *Producto de interés:* ${productName}`;
    }
    if (selectedBranch) {
      msg += `\n🏭 *Centro de distribución:* ${selectedBranch.name} (${selectedBranch.city})`;
    }
    const url = buildEcuadorWhatsAppUrl(mainWhatsapp, msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);

    // 1. Persistir el lead en la base de datos de forma asíncrona (resiliencia ante fallos de WhatsApp)
    persistLeadQuote({
      customerName: contactName,
      companyName: contactCompany,
      phone: contactPhone,
      city: contactCity,
      notes: contactMessage.trim() || `Requerimiento: ${contactReqType}`,
      productName: contactReqType || 'Cotización General de Envases',
      renderedAt: formRenderedAt.current,
    });

    // 2. Redirigir a WhatsApp de ventas
    let text = `🏭 *SOLICITUD DE COTIZACIÓN B2B - ${tenant.name}*\n\n`;
    text += `👤 *Nombre:* ${contactName.trim()}\n`;
    if (contactCompany.trim()) text += `🏢 *Empresa:* ${contactCompany.trim()}\n`;
    text += `📱 *Teléfono / WhatsApp:* ${contactPhone.trim()}\n`;
    if (contactCity.trim()) text += `📍 *Ciudad / Provincia:* ${contactCity.trim()}\n`;
    text += `📦 *Requerimiento:* ${contactReqType}\n`;
    if (contactMessage.trim()) text += `📝 *Mensaje / Volúmenes:* ${contactMessage.trim()}\n`;

    const url = buildEcuadorWhatsAppUrl(mainWhatsapp, text);
    setIsSubmittingContact(false);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`min-h-screen font-sans ${
        isLightBg ? 'text-slate-900 selection:bg-slate-900 selection:text-white' : 'text-slate-100 selection:bg-rose-500 selection:text-white'
      }`}
      style={{
        backgroundColor: landingBgColor,
        backgroundImage: !isLightBg
          ? `radial-gradient(circle at 50% 0%, ${primaryColor}22 0%, transparent 65%)`
          : undefined,
      }}
    >
      {/* Drawer del Carrito Cotizador */}
      <CartDrawer
        tenant={tenant}
        branches={branches}
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
      />

      {/* Header Flotante Integrado sobre la Secuencia de Video (Smart Hide & Sólido en Scroll) */}
      {sections.header.enabled && (
        <div
          className={`fixed-header-wrapper ${
            isHeaderSolid ? 'scrolled solid-header shadow-2xl' : ''
          }`}
          id="fixed-header-wrapper"
          style={{
            transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
            opacity: isHeaderVisible ? 1 : 0,
            pointerEvents: isHeaderVisible ? 'auto' : 'none',
          }}
        >
          {/* Barra de Notificación Industrial Oficial Configurable */}
          {showTopBar && (
            <div
              className="top-promo-bar"
              style={{
                backgroundColor: sections.top_bar.bg_color || secondaryColor,
                opacity: isHeaderSolid ? 1 : undefined,
              }}
            >
              {customTopBarText && customTopBarText.trim() ? (
                customTopBarText.includes('•') ? (
                  customTopBarText.split('•').map((segment: string, idx: number, arr: string[]) => (
                    <React.Fragment key={idx}>
                      <span className={idx > 1 ? 'hidden md:inline' : 'inline'}>{segment.trim()}</span>
                      {idx < arr.length - 1 && <span className={idx >= 1 ? 'hidden md:inline' : 'inline'}>•</span>}
                    </React.Fragment>
                  ))
                ) : (
                  <span>{customTopBarText.trim()}</span>
                )
              ) : (
                <>
                  <span>🏭 <strong>{tenant.name}</strong>{tenant.slug === 'ayme-pet' ? ' | Solutions in Packaging' : ''}</span>
                  <span className="hidden md:inline">•</span>
                  <span className="hidden md:inline">📦 <strong>Ventas Mayoristas & Moldes</strong></span>
                  <span className="hidden sm:inline">•</span>
                  <span>📱 <strong>WhatsApp: {displayPhone}</strong></span>
                </>
              )}
            </div>
          )}

        {/* Header Principal Oficial */}
        <header
          className="site-header"
          id="site-header"
          style={{
            backgroundColor: isHeaderSolid ? (landingBgColor || '#0a1128') : undefined,
            backdropFilter: isHeaderSolid ? 'blur(20px)' : undefined,
            WebkitBackdropFilter: isHeaderSolid ? 'blur(20px)' : undefined,
            borderBottom: isHeaderSolid ? '1px solid rgba(255, 255, 255, 0.15)' : undefined,
            boxShadow: isHeaderSolid ? '0 10px 30px rgba(0, 0, 0, 0.7)' : undefined,
          }}
        >
          <div className="container header-inner">
            <Link
              href={`/store/${tenant.slug}`}
              className="brand-logo-link"
              title={tenant.name}
            >
              <img
                src={tenant.logo_url || '/assets/logo.png'}
                alt={tenant.name}
                loading="eager"
                className="brand-logo-img"
                style={{ height: `${logoHeight}px` }}
              />
            </Link>

            <nav className="main-navigation">
              <ul className="main-nav-links">
                <li>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="nav-link active cursor-pointer bg-transparent border-0"
                  >
                    Inicio
                  </button>
                </li>
                {/* Dropdown de Categorías de Envases */}
                <li className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsProductsDropdownOpen((prev) => !prev)}
                    className="nav-link cursor-pointer bg-transparent border-0 flex items-center gap-1.5"
                  >
                    <span>Catálogo de Envases</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isProductsDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProductsDropdownOpen && (
                    <div
                      className="absolute top-full left-0 mt-2 w-72 rounded-2xl border shadow-2xl p-2 z-50 bg-slate-900 border-slate-700 text-slate-100"
                    >
                      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/50 mb-1 flex items-center justify-between">
                        <span>Líneas de Envases</span>
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold">
                          {categories.length} Líneas
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('all');
                          setIsProductsDropdownOpen(false);
                          document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                          selectedCategory === 'all'
                            ? 'bg-red-500/20 text-red-400 font-bold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span>✨ Todos los Envases</span>
                        <span className="text-[10px] text-slate-400 font-mono">({products.length})</span>
                      </button>

                      {categories.map((cat) => {
                        const count = products.filter((p) => p.category_id === cat.id).length;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setIsProductsDropdownOpen(false);
                              document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                              selectedCategory === cat.id
                                ? 'bg-red-500/20 text-red-400 font-bold'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="truncate pr-2">{cat.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </li>

                {landing.show_services !== false && (
                  <li>
                    <button
                      type="button"
                      onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="nav-link cursor-pointer bg-transparent border-0"
                    >
                      Servicios Industriales
                    </button>
                  </li>
                )}

                <li>
                  <button
                    type="button"
                    onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="nav-link cursor-pointer bg-transparent border-0"
                  >
                    Contacto & Cotizaciones
                  </button>
                </li>
              </ul>
            </nav>

            <div className="header-actions">
              {/* Botón Cotizador */}
              <button
                type="button"
                onClick={openCart}
                className="btn-cart-header cursor-pointer"
                title="Ver lista de cotización"
              >
                <ShoppingCart className="w-5 h-5" style={{ color: secondaryColor }} />
                {totalCartPackages > 0 && (
                  <span className="cart-badge-count">{totalCartPackages}</span>
                )}
              </button>

              {/* Botón WhatsApp de Cabecera Configurable */}
              {sections.header.show_whatsapp_button && (
                <a
                  href={buildEcuadorWhatsAppUrl(mainWhatsapp, `¡Hola ${tenant.name}! Quisiera cotizar ${tenantDefaults.urgentProductType} para mi empresa.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.057-2.148-.528-1.517-.613-2.508-2.143-2.584-2.245-.075-.101-.616-.818-.616-1.56 0-.742.39-1.107.528-1.258.138-.151.301-.189.402-.189.101 0 .202.002.29.006.094.005.22-.036.344.263.126.302.43 1.05.468 1.127.038.077.063.167.013.268-.05.101-.076.164-.151.252-.076.088-.16.196-.228.263-.076.076-.155.158-.067.31.088.151.393.649.843 1.049.578.514 1.066.673 1.217.749.151.075.24.063.328-.038.089-.101.378-.44.479-.592.101-.151.202-.126.34-.075.138.05 8.78 4.14 1.026.479.076.038.126.063.151.101.025.038.025.227-.119.632z"/>
                  </svg>
                  <span className="hidden sm:inline">Cotizar por WhatsApp</span>
                  <span className="inline sm:hidden">Cotizar</span>
                </a>
              )}

              {/* Menú de Perfil de Administrador */}
              {isAdmin && (
                <div className="relative" ref={adminMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsAdminMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white transition-all cursor-pointer shadow-xs"
                    title="Opciones de Administrador"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="hidden sm:inline text-xs font-bold text-slate-200">Admin</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isAdminMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl border bg-slate-900/98 backdrop-blur-xl border-slate-700 text-slate-100 p-2 shadow-2xl z-50 animate-fade-in">
                      <div className="px-3 py-2 border-b border-slate-800 mb-1">
                        <span className="block text-xs font-bold text-white truncate">{tenant.name}</span>
                        <span className="block text-[10px] text-amber-400 font-mono">Sesión Administrador</span>
                      </div>

                      <Link
                        href={`/store/${tenant.slug}/admin`}
                        onClick={() => setIsAdminMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 text-slate-200 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-sky-400" />
                        <span>Volver a Mi Panel</span>
                      </Link>

                      <Link
                        href={`/store/${tenant.slug}/admin?tab=appearance`}
                        onClick={() => setIsAdminMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 text-slate-200 transition-colors"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                        <span>Diseño & Apariencia</span>
                      </Link>

                      <Link
                        href={`/store/${tenant.slug}/admin?tab=products`}
                        onClick={() => setIsAdminMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 text-slate-200 transition-colors"
                      >
                        <Package className="w-4 h-4 text-amber-400" />
                        <span>Gestionar Productos</span>
                      </Link>

                      <div className="pt-1 mt-1 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await fetch(`/api/admin/auth?shopSlug=${tenant.slug}`, { method: 'DELETE' });
                            } catch {
                              // Fallback
                            }
                            window.location.reload();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-400" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botón Menú Móvil */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </header>

        {/* Drawer de Navegación Móvil */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[1000] md:hidden">
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            />
            <div className="fixed top-0 right-0 w-4/5 max-w-xs h-full bg-slate-900 border-l border-slate-800 p-5 flex flex-col justify-between shadow-2xl text-slate-100 animate-fade-in overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <span className="font-bold text-sm tracking-wide text-white">Menú de Navegación</span>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Accesos Rápidos de Administrador en Menú Móvil */}
                {isAdmin && (
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1.5 px-1 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>Administrador de Tienda</span>
                    </div>
                    <div className="space-y-1">
                      <Link
                        href={`/store/${tenant.slug}/admin`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 text-white hover:bg-white/10"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
                        <span>Volver a Mi Panel</span>
                      </Link>
                      <Link
                        href={`/store/${tenant.slug}/admin?tab=appearance`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 text-slate-300 hover:bg-white/10"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Diseño & Apariencia</span>
                      </Link>
                    </div>
                  </div>
                )}

                <ul className="space-y-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                    >
                      <span>🏠 Inicio</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setSelectedCategory('all');
                        document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                    >
                      <span>📦 Catálogo de Envases</span>
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-mono">
                        {products.length}
                      </span>
                    </button>
                  </li>
                  {categories.length > 0 && (
                    <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-800 ml-3 my-1">
                      {categories.slice(0, 5).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setIsMobileMenuOpen(false);
                            document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 truncate flex items-center justify-between"
                        >
                          <span className="truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {landing.show_services !== false && (
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                      >
                        <span>🏭 Servicios Industriales</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    </li>
                  )}
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                    >
                      <span>📍 Contacto & Fábrica</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <a
                  href={buildEcuadorWhatsAppUrl(mainWhatsapp, defaultWelcomeMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp: {displayPhone}</span>
                </a>
                <div className="text-[11px] text-slate-500 text-center">
                  <span>{tenant.name} • {tenantDefaults.subtitle}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* =========================================================================
           SECCIÓN INTERACTIVA: SECUENCIA DE TRANSFORMACIÓN SINCRONIZADA AL SCROLL
           ========================================================================= */}
      <section className="scroll-sequence-track" id="scroll-sequence-track" ref={trackRef}>
        <div className="scroll-sequence-sticky">
          {/* Video de Fondo Industrial Continuo */}
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={landing.hero_image_url || '/hero-machine.jpg'}
            id="hero-background-video"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1,
            }}
          >
            <source src={landing.hero_video_url || '/assets/process-video.mp4'} type="video/mp4" />
          </video>
          <div
            className="sequence-dark-vignette"
            style={{
              background: `radial-gradient(circle at 65% 50%, rgba(11, 17, 32, 0.1) 0%, rgba(11, 17, 32, 0.5) 60%, rgba(11, 17, 32, 0.8) 100%), linear-gradient(to top, ${landingBgColor}, transparent 100%)`,
              zIndex: 2,
            }}
          />

          {/* Capa UI con Telemetría y las 3 Secciones Sincronizadas */}
          <div className="sequence-ui-layer">
            {/* HUD Superior */}
            <div className="sequence-top-hud flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="hud-badge-active text-[10px] sm:text-xs">
                  <span>MONITOREO DE LÍNEA EN TIEMPO REAL</span>
                </div>
                <button
                  type="button"
                  onClick={toggleVideoPlay}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-[10px] sm:text-xs font-mono font-bold text-white border border-slate-700/80 transition-all cursor-pointer shadow-xs"
                  title={isVideoPlaying ? 'Pausar video de planta' : 'Reanudar video'}
                >
                  {isVideoPlaying ? (
                    <Pause className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  )}
                  <span className="hidden sm:inline">{isVideoPlaying ? 'VIDEO EN VIVO' : 'VIDEO PAUSADO'}</span>
                </button>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] sm:text-xs text-slate-300">
                <span>SISTEMA: BLOW-MOLD ROTARY TURBINE • 40 BAR</span>
              </div>
            </div>

            {/* Contenedor Central de las Secciones que aparecen con el scroll */}
            <div className="sequence-middle-container">
              {/* FASE 0: INTRO HERO AL INICIO (Progress 0.0 a 0.22) */}
              <article
                className="sequence-step-card"
                id="sequence-step-intro"
                style={{
                  opacity: introOpacity,
                  transform: `translateY(${introTranslate}px)`,
                  pointerEvents: introOpacity > 0.1 ? 'auto' : 'none',
                }}
              >
                <span className="step-phase-tag text-[10px] sm:text-xs">
                  {heroTag}
                </span>
                <h1 className="step-card-title" style={{ fontSize: 'clamp(1.35rem, 4vw, 2.4rem)' }}>
                  TECNOLOGÍA EN <br />
                  <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--accent)', textTransform: 'none' }}>
                    soplado & inyección
                  </span>
                </h1>
                <p className="step-card-lead text-xs sm:text-sm">
                  Fabricación de envases, botellas, tapas y preformas en PET y PP con tecnología rotativa de alta velocidad para la industria.
                </p>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="btn btn-accent cursor-pointer"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                  >
                    Ver Catálogo {new Date().getFullYear()}
                  </button>
                  <a
                    href={buildEcuadorWhatsAppUrl(mainWhatsapp, `¡Hola ${tenant.name}! Quiero asesoría y cotización.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                  >
                    Cotizar por WhatsApp
                  </a>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>↕</span>
                  <span>Desplace hacia abajo para ver la secuencia sincronizada</span>
                </div>
              </article>

              {/* SECCIÓN SINCRONIZADA 1: Fase 01 (0.22 a 0.58) */}
              <article
                className="sequence-step-card"
                id="sequence-step-1"
                style={{
                  opacity: step1Opacity,
                  transform: `translateY(${step1Translate}px)`,
                  pointerEvents: step1Opacity > 0.1 ? 'auto' : 'none',
                }}
              >
                <span className="step-phase-tag text-[10px] sm:text-xs">FASE 01 / CONTROL TÉRMICO DE PREFORMAS</span>
                <h2 className="step-card-title" style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.85rem)' }}>Inyección & Calentamiento Infrarrojo de Precisión</h2>
                <p className="step-card-lead text-xs sm:text-sm">
                  Las preformas de resina PET 100% virgen entran en el túnel térmico rotativo con control por zonas independientes, asegurando plasticidad perfecta y distribución milimétrica de pared.
                </p>
                <div className="step-features-grid">
                  <div className="step-feat-box">
                    <h5>🔥 Infrarrojo Modular</h5>
                    <p>Perfil térmico calibrado según el gramaje del envase.</p>
                  </div>
                  <div className="step-feat-box">
                    <h5>🔬 Cuello PCO Sellado</h5>
                    <p>Protección térmica en la rosca para cero deformaciones.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn btn-accent btn-block cursor-pointer"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                >
                  Conocer Proceso de Inyección
                </button>
              </article>

              {/* SECCIÓN SINCRONIZADA 2: Fase 02 (0.58 a 0.98) */}
              <article
                className="sequence-step-card"
                id="sequence-step-2"
                style={{
                  opacity: step2Opacity,
                  transform: `translateY(${step2Translate}px)`,
                  pointerEvents: step2Opacity > 0.1 ? 'auto' : 'none',
                }}
              >
                <span className="step-phase-tag text-[10px] sm:text-xs" style={{ background: 'rgba(37, 211, 102, 0.2)', color: '#25D366' }}>
                  FASE 02 / BI-ORIENTACIÓN MOLECULAR
                </span>
                <h2 className="step-card-title" style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.85rem)' }}>Soplado Rotativo a 40 Bar & Enfriamiento Criogénico</h2>
                <p className="step-card-lead text-xs sm:text-sm">
                  Las varillas de estiramiento servoasistidas expanden la preforma mientras el aire a alta presión copia cada detalle del molde en aluminio aeronáutico refrigerado.
                </p>
                <div className="step-features-grid">
                  <div className="step-feat-box">
                    <h5>⚡ Alta Resistencia</h5>
                    <p>Bi-orientación molecular que triplica la resistencia a caídas.</p>
                  </div>
                  <div className="step-feat-box">
                    <h5>❄️ Enfriamiento Rápido</h5>
                    <p>Ciclo ultraveloz con fondo petaloide libre de tensiones.</p>
                  </div>
                </div>
                <a
                  href={buildEcuadorWhatsAppUrl(mainWhatsapp, `¡Hola ${tenant.name}! Deseo cotizar fabricación en volumen de envases.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-block"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                >
                  Cotizar Producción por WhatsApp
                </a>
              </article>

              {/* Indicador Lateral de Progreso Interactivo */}
              <div className="sequence-timeline-hud">
                <button
                  type="button"
                  onClick={() => scrollToPhase(0.38)}
                  className={`timeline-node cursor-pointer transition-all bg-transparent border-0 p-1 rounded hover:text-white hover:scale-125 ${
                    scrollProgress >= 0.22 && scrollProgress <= 0.58 ? 'text-white font-extrabold scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'text-white/60'
                  }`}
                  title="Ir a Fase 01: Inyección & Control Térmico"
                >
                  01
                </button>
                <div
                  className="timeline-track-bar cursor-pointer group"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickY = e.clientY - rect.top;
                    const ratio = Math.max(0, Math.min(1, clickY / rect.height));
                    // Mapear de 0-1 del track a 0.22 - 0.95 de la secuencia
                    scrollToPhase(0.22 + ratio * 0.73);
                  }}
                  title="Haga clic para saltar en la secuencia"
                >
                  <div
                    className="timeline-fill-bar"
                    id="sequence-progress-bar"
                    style={{ height: `${scrollProgress * 100}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => scrollToPhase(0.78)}
                  className={`timeline-node cursor-pointer transition-all bg-transparent border-0 p-1 rounded hover:text-white hover:scale-125 ${
                    scrollProgress >= 0.58 ? 'text-white font-extrabold scale-110 drop-shadow-[0_0_8px_rgba(37,211,102,0.8)]' : 'text-white/60'
                  }`}
                  title="Ir a Fase 02: Soplado Rotativo & Enfriamiento Criogénico"
                >
                  02
                </button>
              </div>
            </div>

            {/* HUD Inferior con Telemetría Sincronizada */}
            <div className="sequence-bottom-hud">
              <div className="hud-telemetry-col">
                <span>SECUENCIA: </span>
                <strong id="telemetry-frame-val">FR-{String(frameIndex).padStart(4, '0')} / 0144</strong>
              </div>
              <div className="hud-telemetry-col">
                <span>SINCRONIZACIÓN: </span>
                <strong id="telemetry-progress-val">{Math.round(scrollProgress * 100)}%</strong>
              </div>
              <div className="hud-telemetry-col">
                <span>VELOCIDAD: </span>
                <strong>12.000 BPH CONTINUO</strong>
              </div>
              <div className="hud-telemetry-col">
                <span>SCROLL INTERACTIVO: </span>
                <strong>BIDIRECCIONAL ↕</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
           SECCIÓN DE CATÁLOGO: ENVASES DESTACADOS Y FILTROS POR LÍNEAS
           ========================================================================= */}
      <section id="catalog-section" className="py-6 sm:py-10" style={{ background: 'var(--bg-main)' }}>
        <div className="container">
          {/* Barra de Búsqueda Reactiva en Vivo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por capacidad (500ml, 1L), boca (28mm), nombre..."
                className="w-full pl-10 pr-8 py-2.5 rounded-xl text-xs sm:text-sm border transition-all focus:outline-none bg-white border-slate-200 text-slate-900 focus:border-red-600 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>Mostrando <strong>{displayedProducts.length}</strong> de <strong>{filteredProducts.length}</strong> referencias técnicas</span>
            </div>
          </div>

          {/* Filtros de Categorías */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-xs"
              style={
                selectedCategory === 'all'
                  ? {
                      backgroundColor: primaryColor,
                      color: '#ffffff',
                      boxShadow: `0 4px 14px -2px ${primaryColor}50`,
                    }
                  : {
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                    }
              }
            >
              Todos ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-xs"
                  style={
                    selectedCategory === cat.id
                      ? {
                          backgroundColor: primaryColor,
                          color: '#ffffff',
                          boxShadow: `0 4px 14px -2px ${primaryColor}50`,
                        }
                      : {
                          backgroundColor: '#ffffff',
                          color: '#475569',
                          border: '1px solid #e2e8f0',
                        }
                  }
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Filtros Rápidos por Capacidad Técnica */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-6 no-scrollbar text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1 flex items-center gap-1 shrink-0">
              <SlidersHorizontal className="w-3 h-3 text-slate-400" />
              <span>Capacidad:</span>
            </span>
            {[
              { id: 'all', label: 'Todas' },
              { id: '60ml', label: '60 ml (2 Oz)' },
              { id: '250ml', label: '250 ml' },
              { id: '500ml', label: '500 ml' },
              { id: '1000ml', label: '1 Litro' },
              { id: '4000ml', label: '1 Galón (4L)' },
            ].map((cap) => (
              <button
                key={cap.id}
                type="button"
                onClick={() => setSelectedCapacity(cap.id)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCapacity === cap.id
                    ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cap.label}
              </button>
            ))}
          </div>

          {/* Grid de Productos Oficial */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 px-6 max-w-xl mx-auto rounded-3xl border bg-white border-slate-200 shadow-sm">
              <div
                className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg border"
                style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}40` }}
              >
                <Package className="w-7 h-7" style={{ color: primaryColor }} />
              </div>
              <h4 className="font-bold text-lg mb-2 text-slate-900">
                No se encontraron referencias para esta búsqueda
              </h4>
              <p className="text-xs mb-6 leading-relaxed max-w-md mx-auto text-slate-500">
                Prueba con otra capacidad o restablece los filtros para ver todo el catálogo disponible.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="font-bold text-xs px-5 py-2.5 rounded-xl shadow-md text-white transition-all hover:brightness-110 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            <div className="products-grid" id="products-grid">
              {displayedProducts.map((product) => {
                const specs = product.attributes?.specs || {};
                const badge = product.attributes?.badge;
                const packSize = product.units_per_package || 1;
                const productHref = `/store/${tenant.slug}/producto/${encodeURIComponent(product.slug || product.sku?.toLowerCase() || product.id)}`;

                return (
                  <div
                    key={product.id}
                    className="product-card group"
                  >
                    <Link
                      href={productHref}
                      className="product-img-box block relative aspect-square w-full bg-slate-50 overflow-hidden cursor-pointer"
                      title={`Ver ficha técnica de ${product.name}`}
                    >
                      {badge && (
                        <span className="product-badge" style={{ backgroundColor: primaryColor }}>
                          {badge}
                        </span>
                      )}

                      {product.images && product.images.length > 0 && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e: any) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/placeholder-product.svg';
                          }}
                          className="product-img w-full h-full object-contain p-2 sm:p-3 transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-3xl sm:text-5xl py-8 sm:py-12 text-center text-slate-300">♳</div>
                      )}
                    </Link>

                    <div className="p-2 sm:p-4 flex flex-col flex-1 justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                          <span className="font-semibold truncate max-w-[65%]" style={{ color: primaryColor }}>
                            {categories.find((c) => c.id === product.category_id)?.name || (tenant.slug === 'ayme-pet' || tenant.industry_type === 'plastics' ? 'Envase PET' : 'General')}
                          </span>
                          <span className="text-slate-400 font-mono text-[9px] sm:text-[11px]">{product.sku}</span>
                        </div>

                        <Link
                          href={productHref}
                          className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 hover:underline mb-1.5 sm:mb-2 leading-snug"
                        >
                          {product.name}
                        </Link>

                        {/* Specs Rápidas */}
                        {Object.keys(specs).length > 0 && (
                          <div className="grid grid-cols-2 gap-1 bg-slate-50 border border-slate-100 rounded-lg p-1.5 sm:p-2 mb-2 text-[10px] sm:text-xs">
                            {Object.entries(specs)
                              .slice(0, 2)
                              .map(([k, v]) => (
                                <div key={k} className="flex flex-col">
                                  <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-medium truncate">{k.replace('_', ' ')}</span>
                                  <span className="font-bold text-slate-700 truncate">{String(v)}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[9px] sm:text-[10px] text-slate-400">Empaque</span>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-800">{packSize} u/{packagingUnit.singular.toLowerCase()}</span>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <Link
                            href={productHref}
                            className="btn btn-outline cursor-pointer inline-flex items-center gap-1"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.72rem' }}
                            title="Ver Ficha Técnica en página separada"
                          >
                            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Ficha</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => addItem(product)}
                            className="btn btn-outline cursor-pointer"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.72rem' }}
                            title="Agregar al Cotizador"
                          >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleWhatsAppQuote(product.name)}
                            className="btn btn-whatsapp cursor-pointer"
                            style={{ padding: '0.35rem 0.5rem' }}
                            title="Cotizar por WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación progresiva */}
          {products.length > 0 && visibleCount < filteredProducts.length && (
            <div className="text-center" style={{ marginTop: '3rem' }}>
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 24)}
                className="btn btn-primary"
              >
                <span>Ver más referencias ({filteredProducts.length - visibleCount} restantes)</span>
                <ChevronRight className="w-4 h-4 rotate-90" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
           SECCIÓN DE SERVICIOS INDUSTRIALES
           ========================================================================= */}
      {landing.show_services !== false && (
        <section id="services-section" className="py-8 sm:py-16" style={{ background: '#FFFFFF', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Capacidad de Planta</span>
              <h2 className="section-title">Servicios Industriales en Plásticos PET & PP</h2>
              <p className="section-subtitle">
                Desde el diseño del molde y la inyección de preformas hasta el soplado, etiquetado y logística nacional para su empresa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Servicio 1 */}
              <div className="service-card rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="h-48 relative overflow-hidden bg-slate-900">
                    <img
                      src="/assets/services/service-01.webp"
                      alt="Soplado e Inyección de Envases"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = '//img1.wsimg.com/isteam/ip/e22b46da-7172-4420-8f89-b873eb8244bd/gettyimages-2149182258-612x612.webp/:/cr=t:0%25,l:5.67%25,w:88.67%25,h:100%25/rs=w:612,h:460,cg:true';
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded">
                      01 • SOPLADO & INYECCIÓN
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 text-slate-900">
                      Diseño, desarrollo y fabricación de envases PET, tapas y accesorios en PP
                    </h3>
                    <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                      Producción rotativa en alta cadencia para alimentos, bebidas, farma y químicos con cuello PCO 28mm y 38mm libre de deformaciones.
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceOptionType('Botella PET Estándar');
                      setServiceCapacity('500 ml / 28mm PCO');
                      setServiceVolume('10.000 a 25.000 uds/mes');
                      setActiveServiceModal({
                        id: 'soplado',
                        title: 'Diseño, desarrollo y fabricación de envases PET, tapas y accesorios en PP',
                        tag: '01 • SOPLADO & INYECCIÓN',
                      });
                    }}
                    className="btn btn-accent btn-block cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Configurar y Cotizar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Servicio 2 */}
              <div className="service-card rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="h-48 relative overflow-hidden bg-slate-900">
                    <img
                      src="/assets/services/service-02.webp"
                      alt="Tapas, liners y accesorios"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = '//img1.wsimg.com/isteam/ip/e22b46da-7172-4420-8f89-b873eb8244bd/gettyimages-1669778843-2048x2048.webp/:/cr=t:0%25,l:5.68%25,w:88.65%25,h:100%25/rs=w:730,h:549,cg:true';
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded">
                      02 • TAPAS & ACCESORIOS
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 text-slate-900">
                      Proveedores de tapas, liners y accesorios para envases plásticos
                    </h3>
                    <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                      Suministro masivo de tapas de seguridad inviolable, liners de inducción para hermeticidad total, atomizadores y bombas dosificadoras.
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceOptionType('Tapas de Seguridad Inviolable');
                      setServiceCapacity('Rosca 28mm PCO 1881');
                      setServiceVolume('20.000 uds/fardo');
                      setActiveServiceModal({
                        id: 'tapas',
                        title: 'Proveedores de tapas, liners y accesorios para envases plásticos',
                        tag: '02 • TAPAS & ACCESORIOS',
                      });
                    }}
                    className="btn btn-accent btn-block cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Configurar y Cotizar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Servicio 3 */}
              <div className="service-card rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="h-48 relative overflow-hidden bg-slate-900">
                    <img
                      src="/assets/services/service-03.png"
                      alt="Moldes 3D y Matricería"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = '//img1.wsimg.com/isteam/ip/e22b46da-7172-4420-8f89-b873eb8244bd/blob-9c30011.png/:/cr=t:0%25,l:12.59%25,w:74.81%25,h:100%25/rs=w:730,h:549,cg:true';
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded">
                      03 • INGENIERÍA DE MOLDES
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 text-slate-900">
                      Personalización de proyectos, matricería 3D y moldes exclusivos
                    </h3>
                    <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                      Modelado CAD 3D para moldes exclusivos de tu marca en aluminio aeronáutico refrigerado con optimización de gramaje y resistencia.
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceOptionType('Desarrollo de Molde Exclusivo 3D');
                      setServiceCapacity('Diseño a medida según muestra');
                      setServiceVolume('Matriz 1 a 4 cavidades');
                      setActiveServiceModal({
                        id: 'moldes',
                        title: 'Personalización de proyectos, matricería 3D y moldes exclusivos',
                        tag: '03 • INGENIERÍA DE MOLDES',
                      });
                    }}
                    className="btn btn-accent btn-block cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Configurar y Cotizar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Respaldo Industrial */}
            <div className="mt-8 sm:mt-16 bg-slate-50 rounded-2xl p-4 sm:p-8 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 text-center">
              <div>
                <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🏆</div>
                <h4 className="text-sm sm:text-base font-bold mb-1" style={{ color: primaryColor }}>Inocuidad & BPM</h4>
                <p className="text-xs sm:text-sm text-slate-500">Resina 100% virgen certificada para contacto alimentario y farmacéutico sin migración.</p>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">⚙️</div>
                <h4 className="text-sm sm:text-base font-bold mb-1" style={{ color: primaryColor }}>Alta Cadencia Rotativa</h4>
                <p className="text-xs sm:text-sm text-slate-500">Capacidad de +12.000 BPH y mecanizado CNC de moldes con diseño exclusivo.</p>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🚛</div>
                <h4 className="text-sm sm:text-base font-bold mb-1" style={{ color: primaryColor }}>Logística & Despacho Nacional</h4>
                <p className="text-xs sm:text-sm text-slate-500">Entregas paletizadas seguras a todo el Ecuador y retiro directo en planta Quito.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
           SECCIÓN DE CONTACTO & UBICACIÓN GOOGLE MAPS
           ========================================================================= */}
      <section id="contact-section" className="py-8 sm:py-16" style={{ background: '#FFFFFF', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Planta Industrial & Ventas</span>
            <h2 className="section-title">Contacto & Ubicación de Fábrica</h2>
            <p className="section-subtitle">
              Visite nuestras instalaciones, solicite un kit de muestras físicas o cotice directamente con nuestros asesores.
            </p>
          </div>

          <div className="contact-grid">
            {/* Formulario de Contacto B2B */}
            <div className="contact-card-box">
              <h3 style={{ fontSize: '1.35rem', color: primaryColor, marginBottom: '0.4rem', fontWeight: 700 }}>
                Solicitud de Cotización & Muestras
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
                Complete sus datos para recibir asesoría técnica y cotización formal por WhatsApp.
              </p>

              <form onSubmit={handleContactSubmit} className="custom-contact-form">
                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label">Nombre y Apellido *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Ing. Marco Salgado"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Empresa / Razón Social</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Envasadora del Valle"
                      value={contactCompany}
                      onChange={(e) => setContactCompany(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="0998722324"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ciudad / Provincia *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Quito / Guayaquil / Cuenca"
                      value={contactCity}
                      onChange={(e) => setContactCity(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {tenantDefaults.contactReqLabel}
                  </label>
                  <select
                    className="form-select"
                    value={contactReqType}
                    onChange={(e) => setContactReqType(e.target.value)}
                  >
                    {tenantDefaults.contactOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Mensaje / Cantidades estimadas</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Indique cantidades mensuales requeridas, color de envase deseado o requerimientos especiales..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="btn btn-whatsapp btn-lg btn-block cursor-pointer disabled:opacity-50"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.057-2.148-.528-1.517-.613-2.508-2.143-2.584-2.245-.075-.101-.616-.818-.616-1.56 0-.742.39-1.107.528-1.258.138-.151.301-.189.402-.189.101 0 .202.002.29.006.094.005.22-.036.344.263.126.302.43 1.05.468 1.127.038.077.063.167.013.268-.05.101-.076.164-.151.252-.076.088-.16.196-.228.263-.076.076-.155.158-.067.31.088.151.393.649.843 1.049.578.514 1.066.673 1.217.749.151.075.24.063.328-.038.089-.101.378-.44.479-.592.101-.151.202-.126.34-.075.138.05 8.78 4.14 1.026.479.076.038.126.063.151.101.025.038.025.227-.119.632z"/>
                  </svg>
                  <span>{isSubmittingContact ? 'Registrando cotización...' : 'Enviar Solicitud por WhatsApp'}</span>
                </button>
              </form>
            </div>

            {/* Columna Google Maps & Datos de Fábrica */}
            <div className="contact-info-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Mapa Interactivo de Google Maps - Llano Grande, Quito */}
              <div className="google-maps-container" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', boxShadow: 'var(--shadow-md)' }}>
                <iframe
                  src={(landing as any)?.maps_embed_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15959.278385012543!2d-78.45524675!3d-0.11467465!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d58fb442f4625b%3A0xe5438843c08f654b!2sLlano%20Grande%2C%20Quito!5e0!3m2!1ses!2sec!4v1700000000000!5m2!1ses!2sec"}
                  width="100%"
                  height="240"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen={false}
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Ubicación Planta ${tenant.name}`}
                />
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(8px)', padding: '0.45rem 0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 700 }}>
                    📍 {tenantDefaults.plantLocation}
                  </span>
                  <a
                    href={(landing as any)?.maps_url || `https://maps.google.com/?q=${encodeURIComponent(tenantDefaults.plantLocation)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, textDecoration: 'underline' }}
                  >
                    Ver en Google Maps ↗
                  </a>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '1.15rem', marginBottom: '0.25rem', fontWeight: 700 }}>
                  {tenant.name}
                </h4>
                <p style={{ color: 'var(--accent-light)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.85rem' }}>
                  {tenantDefaults.subtitle}
                </p>

                <ul className="contact-channels-list" style={{ marginBottom: 0 }}>
                  <li className="contact-channel-item">
                    <div className="channel-icon-circle">📍</div>
                    <div className="channel-text-box">
                      <h5>Planta de Fabricación</h5>
                      <span style={{ fontSize: '0.85rem' }}>
                        {tenantDefaults.address}
                      </span>
                    </div>
                  </li>
                  <li className="contact-channel-item">
                    <div className="channel-icon-circle">💬</div>
                    <div className="channel-text-box">
                      <h5>Teléfono / WhatsApp Directo</h5>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                        {displayPhone}
                      </span>
                    </div>
                  </li>
                  <li className="contact-channel-item">
                    <div className="channel-icon-circle">✉️</div>
                    <div className="channel-text-box">
                      <h5>Ventas & Cotizaciones</h5>
                      <span style={{ fontSize: '0.85rem' }}>
                        {tenantDefaults.email}
                      </span>
                    </div>
                  </li>
                  <li className="contact-channel-item">
                    <div className="channel-icon-circle">⏰</div>
                    <div className="channel-text-box">
                      <h5>Horarios de Atención</h5>
                      <span style={{ fontSize: '0.82rem' }}>
                        {landing.hours || 'Lun a Vie: 8:00 AM - 5:30 PM | Sábados: 8:30 AM - 1:00 PM'}
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', padding: '1.1rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                <h5 style={{ color: '#ffffff', marginBottom: '0.35rem', fontSize: '0.92rem', fontWeight: 700 }}>⚡ Despacho Inmediato</h5>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginBottom: '0.65rem' }}>
                  ¿Su línea de producción requiere envases urgentes? Escríbanos directamente a planta.
                </p>
                <a
                  href={buildEcuadorWhatsAppUrl(urgentWhatsapp, `⚡ PEDIDO URGENTE: Requiero despacho inmediato de ${tenantDefaults.urgentProductType} para línea de producción en planta.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-accent btn-block"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Contactar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Corporativo Oficial */}
      {sections.footer.enabled && (
        <footer className="site-footer">
          <div className="container">
            <div className="footer-bottom-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p className="copyright-text" style={{ margin: 0 }}>
                  {sections.footer.copyright_text || `© ${new Date().getFullYear()} ${tenant.name}. Todos los derechos reservados${tenant.slug === 'ayme-pet' ? '. Solutions in Packaging.' : '.'}`}
                </p>
                {/* Redes Sociales Oficiales B2B (Sanitizadas contra XSS) */}
                {(safeExternalUrl(social.linkedin) || safeExternalUrl(social.facebook) || safeExternalUrl(social.instagram) || safeExternalUrl(social.tiktok) || safeExternalUrl(social.youtube)) && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs">
                    <span className="text-slate-400 font-semibold text-[11px]">Canales Oficiales:</span>
                    {safeExternalUrl(social.linkedin) && (
                      <a href={safeExternalUrl(social.linkedin)!} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors" title="LinkedIn">
                        💼 LinkedIn
                      </a>
                    )}
                    {safeExternalUrl(social.facebook) && (
                      <a href={safeExternalUrl(social.facebook)!} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors" title="Facebook">
                        📘 Facebook
                      </a>
                    )}
                    {safeExternalUrl(social.instagram) && (
                      <a href={safeExternalUrl(social.instagram)!} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors" title="Instagram">
                        📸 Instagram
                      </a>
                    )}
                    {safeExternalUrl(social.tiktok) && (
                      <a href={safeExternalUrl(social.tiktok)!} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors" title="TikTok">
                        🎵 TikTok
                      </a>
                    )}
                    {safeExternalUrl(social.youtube) && (
                      <a href={safeExternalUrl(social.youtube)!} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors" title="YouTube">
                        ▶️ YouTube
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3 sm:mt-0">
                <div className="footer-badges flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-400">
                  <span>🏆 Inocuidad BPM</span>
                  <span className="hidden sm:inline">•</span>
                  <span>♻️ PET 100% Reciclable</span>
                  <span className="hidden sm:inline">•</span>
                  <span>📦 Despacho Paletizado</span>
                </div>
                <VersionBadge className="bg-slate-900 border-slate-800 text-slate-400" />
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Modal Interactivo de Requerimiento Técnico de Servicios Industriales */}
      {activeServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
              <div>
                <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {activeServiceModal.tag}
                </span>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-1.5 leading-snug">
                  Configuración Técnica de Requerimiento
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete los parámetros de su línea para recibir cotización de fábrica y asesoría técnica.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveServiceModal(null)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleServiceModalSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tipo de Requerimiento / Producto</label>
                <input
                  type="text"
                  value={serviceOptionType}
                  onChange={(e) => setServiceOptionType(e.target.value)}
                  placeholder="Ej: Botella Cilíndrica PET / Tapa Flip-top"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Capacidad / Rosca / Medida</label>
                  <input
                    type="text"
                    value={serviceCapacity}
                    onChange={(e) => setServiceCapacity(e.target.value)}
                    placeholder="Ej: 500 ml / 28mm PCO"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-red-600"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Volumen Estimado</label>
                  <input
                    type="text"
                    value={serviceVolume}
                    onChange={(e) => setServiceVolume(e.target.value)}
                    placeholder="Ej: 10.000 uds/mes"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-red-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Su Nombre / Contacto</label>
                  <input
                    type="text"
                    value={serviceCustomerName}
                    onChange={(e) => setServiceCustomerName(e.target.value)}
                    placeholder="Ej: Ing. Carlos V."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Empresa / Razón Social</label>
                  <input
                    type="text"
                    value={serviceCustomerCompany}
                    onChange={(e) => setServiceCustomerCompany(e.target.value)}
                    placeholder="Ej: Embotelladora Andina"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Teléfono / WhatsApp de Contacto *</label>
                <input
                  type="tel"
                  value={serviceCustomerPhone}
                  onChange={(e) => setServiceCustomerPhone(e.target.value)}
                  placeholder="Ej: 0998722324"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Especificaciones Técnicas / Observaciones</label>
                <textarea
                  rows={2}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Detalles sobre gramaje, coloración masterbatch, moldes existentes o plazos..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full btn btn-whatsapp flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm shadow-md cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Requerimiento Técnico a WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleWhatsAppQuote(activeServiceModal.title);
                    setActiveServiceModal(null);
                  }}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 py-1 transition-colors cursor-pointer"
                >
                  O chatear directo sin completar formulario ↗
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Botón Flotante de WhatsApp Comercial (Ecuador) - Ubicado a la derecha */}
      {social.show_floating_whatsapp !== false && (
        <aside
          aria-label="Atención por WhatsApp"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 sm:gap-3 group animate-fade-in"
        >
          <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl pointer-events-none whitespace-nowrap">
            ¿Cotizamos por WhatsApp? 💬
          </div>
          <a
            href={buildEcuadorWhatsAppUrl(mainWhatsapp, defaultWelcomeMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/40 hover:scale-108 transition-all active:scale-95 cursor-pointer relative"
            title={`Chatear por WhatsApp con ${tenant.name} (${displayPhone})`}
          >
            <span className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-emerald-300 absolute -top-0.5 -right-0.5 animate-ping opacity-75" />
            <span className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 border-2 border-white" />
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          </a>
        </aside>
      )}
    </div>
  );
}
