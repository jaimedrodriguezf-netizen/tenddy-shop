'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Search,
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Package,
  Layers,
  Send,
  Sparkles
} from 'lucide-react';
import { CustomStorefrontProps } from '../registry';
import { Product } from '@/lib/types';

export default function AymeStorefront({
  tenant,
  products,
  categories,
  branches,
  isAdmin,
}: CustomStorefrontProps) {
  // Estados de navegación y filtros
  const [currentView, setCurrentView] = useState<'home' | 'productos' | 'servicios' | 'contacto'>('home');
  const [currentSector, setCurrentSector] = useState<'all' | 'bebidas' | 'farma_cosmetica' | 'industrial'>('all');
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Teléfono comercial
  const landing = tenant.landing_config || {};
  const mainPhone = landing.display_phone || '0998722324';
  const whatsappNumber = landing.whatsapp_default || '593998722324';
  const mainBranch = branches[0] || null;

  // Filtro de productos en vivo desde Supabase
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // 1. Filtro por Sector
    if (currentSector !== 'all') {
      list = list.filter((p) => {
        const sector = p.attributes?.sector;
        if (sector) return sector === currentSector;
        // Inferencia por categoría si no tiene sector explícito
        const catObj = categories.find((c) => c.id === p.category_id);
        const catSlug = catObj?.slug || '';
        if (currentSector === 'industrial') return catSlug === 'quimicos' || catSlug === 'preformas';
        if (currentSector === 'farma_cosmetica') return catSlug === 'farma' || catSlug === 'cosmetica';
        return catSlug === 'bebidas' || catSlug === 'alimentos' || catSlug === 'tapas';
      });
    }

    // 2. Filtro por Categoría
    if (currentCategory !== 'all') {
      list = list.filter((p) => {
        if (p.category_id === currentCategory) return true;
        const catObj = categories.find((c) => c.id === p.category_id);
        return catObj?.slug === currentCategory;
      });
    }

    // 3. Búsqueda textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.attributes?.specs?.boca && p.attributes.specs.boca.toLowerCase().includes(q)) ||
          (p.attributes?.specs?.capacidad && p.attributes.specs.capacidad.toLowerCase().includes(q))
      );
    }

    return list;
  }, [products, categories, currentSector, currentCategory, searchQuery]);

  const handleWhatsAppContact = (text?: string) => {
    const defaultMsg = text || '¡Hola AYME INDUSTRIAS PET! Quisiera solicitar cotización de envases plásticos para mi empresa.';
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMsg)}`, '_blank');
  };

  const handleProductWhatsApp = (p: Product) => {
    const msg = `¡Hola AYME INDUSTRIAS PET! Quisiera cotizar el envase: *${p.name}* (SKU: ${p.sku || 'N/A'}). Cantidad requerida: fardos o pallet.`;
    handleWhatsAppContact(msg);
  };

  return (
    <div className="ayme-corporate-theme">
      {/* Importar la hoja de estilos oficial de AYME INDUSTRIAS PET */}
      <link rel="stylesheet" href="/css/style.css" />

      {/* Botón Flotante para Administradores de la Tienda */}
      {isAdmin && (
        <div style={{ position: 'fixed', top: '12px', right: '12px', zIndex: 10000 }}>
          <Link
            href={`/store/${tenant.slug}/admin`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#141E33',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '11px',
              padding: '8px 14px',
              borderRadius: '12px',
              border: '1px solid #2A3E66',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.4)',
              textDecoration: 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            <LayoutDashboard style={{ width: '14px', height: '14px', color: '#38BDF8' }} />
            <span>Volver a Mi Panel</span>
          </Link>
        </div>
      )}

      {/* =========================================================================
          1. HEADER FLOTANTE CORPORATIVO (AYME OFICIAL)
          ========================================================================= */}
      <div className="fixed-header-wrapper" id="fixed-header-wrapper">
        {/* Barra de Notificación Industrial */}
        <div className="top-promo-bar">
          <span>🏭 <strong>AYME INDUSTRIAS PET</strong> | Solutions in Packaging</span>
          <span>•</span>
          <span>📦 <strong>Ventas Mayoristas & Fabricación de Moldes</strong></span>
          <span>•</span>
          <span>📱 <strong>WhatsApp Comercial: {mainPhone}</strong></span>
        </div>

        {/* Header Principal con Logo Oficial */}
        <header className="site-header" id="site-header">
          <div className="container header-inner">
            <button
              type="button"
              onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="brand-logo-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              title="AYME INDUSTRIAS PET"
            >
              <img
                src="/assets/logo.png"
                alt="AYME INDUSTRIAS PET - Solutions in Packaging"
                className="brand-logo-img"
              />
            </button>

            <nav className="main-navigation">
              <ul className="main-nav-links">
                <li>
                  <button
                    type="button"
                    onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Inicio
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => { setCurrentView('productos'); }}
                    className={`nav-link ${currentView === 'productos' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Catálogo de Envases
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => { setCurrentView('servicios'); }}
                    className={`nav-link ${currentView === 'servicios' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Servicios Industriales
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => { setCurrentView('contacto'); }}
                    className={`nav-link ${currentView === 'contacto' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Contacto & Cotizaciones
                  </button>
                </li>
              </ul>
            </nav>

            <div className="header-actions">
              <button
                type="button"
                onClick={() => handleWhatsAppContact()}
                className="btn btn-whatsapp"
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.92rem', cursor: 'pointer' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.057-2.148-.528-1.517-.613-2.508-2.143-2.584-2.245-.075-.101-.616-.818-.616-1.56 0-.742.39-1.107.528-1.258.138-.151.301-.189.402-.189.101 0 .202.002.29.006.094.005.22-.036.344.263.126.302.43 1.05.468 1.127.038.077.063.167.013.268-.05.101-.076.164-.151.252-.076.088-.16.196-.228.263-.076.076-.155.158-.067.31.088.151.393.649.843 1.049.578.514 1.066.673 1.217.749.151.075.24.063.328-.038.089-.101.378-.44.479-.592.101-.151.202-.126.34-.075.138.05 8.78 4.14 1.026.479.076.038.126.063.151.101.025.038.025.227-.119.632z" />
                </svg>
                <span>Cotizar por WhatsApp</span>
              </button>

              {/* Botón Menú Móvil */}
              <button
                type="button"
                className="mobile-menu-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Abrir Menú"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Menú Móvil Desplegable */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            style={{
              width: '80%',
              maxWidth: '300px',
              backgroundColor: '#1F2E4D',
              height: '100%',
              padding: '24px',
              color: '#ffffff',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <img src="/assets/logo.png" alt="AYME" style={{ height: '38px' }} />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '15px', fontWeight: 600 }}>
              <button
                type="button"
                onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }}
                style={{ background: 'none', border: 'none', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
              >
                Inicio
              </button>
              <button
                type="button"
                onClick={() => { setCurrentView('productos'); setIsMobileMenuOpen(false); }}
                style={{ background: 'none', border: 'none', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
              >
                Catálogo de Envases
              </button>
              <button
                type="button"
                onClick={() => { setCurrentView('servicios'); setIsMobileMenuOpen(false); }}
                style={{ background: 'none', border: 'none', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
              >
                Servicios Industriales
              </button>
              <button
                type="button"
                onClick={() => { setCurrentView('contacto'); setIsMobileMenuOpen(false); }}
                style={{ background: 'none', border: 'none', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
              >
                Contacto & Cotizaciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. VISTA 1: HOME (HERO INDUSTRIAL SIN VIDEO PESADO - CARGA INSTANTÁNEA)
          ========================================================================= */}
      {currentView === 'home' && (
        <main>
          {/* Hero Banner Industrial de Alto Rendimiento */}
          <section
            style={{
              position: 'relative',
              minHeight: '85vh',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#141E33',
              backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(31, 46, 77, 0.8) 0%, rgba(20, 30, 51, 0.95) 70%), url("/hero-machine.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              paddingTop: '120px',
              paddingBottom: '80px',
              color: '#ffffff',
            }}
          >
            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
              <div style={{ maxWidth: '680px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(166, 28, 46, 0.18)',
                    color: '#F87171',
                    border: '1px solid rgba(166, 28, 46, 0.4)',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '18px',
                  }}
                >
                  AYME INDUSTRIAS PET • PACKAGING ENGINEERING
                </span>

                <h1
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '2.8rem',
                    fontWeight: 900,
                    lineHeight: 1.15,
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                  }}
                >
                  TECNOLOGÍA EN <br />
                  <span style={{ color: '#A61C2E', fontStyle: 'italic', textTransform: 'none' }}>
                    soplado & inyección
                  </span>
                </h1>

                <p
                  style={{
                    fontSize: '1.05rem',
                    color: '#CBD5E1',
                    lineHeight: 1.6,
                    marginBottom: '32px',
                    maxWidth: '560px',
                  }}
                >
                  Fabricación de envases, botellas, tapas y preformas en PET y PP con tecnología rotativa de alta velocidad para la industria de bebidas, farmacéutica, cosmética y químicos.
                </p>

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '40px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentView('productos')}
                    className="btn btn-accent"
                    style={{ padding: '0.8rem 1.6rem', fontSize: '0.95rem', cursor: 'pointer' }}
                  >
                    Ver Catálogo ({products.length} Envases)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWhatsAppContact('Hola AYME INDUSTRIAS PET, quisiera asesoría técnica y cotización.')}
                    className="btn btn-outline"
                    style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', padding: '0.8rem 1.6rem', fontSize: '0.95rem', cursor: 'pointer' }}
                  >
                    Cotizar por WhatsApp
                  </button>
                </div>

                {/* Métricas y Garantías de Fábrica */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '16px',
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8' }}>+15 Millones</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Envases Anuales</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34D399' }}>100% Virgen</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>PET Grado Alimentario</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FBBF24' }}>24 - 48 h</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Despachos Nacionales</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Fases de Transformación Industrial */}
          <section style={{ backgroundColor: '#F8FAFC', padding: '60px 0', borderBottom: '1px solid #E2E8F0' }}>
            <div className="container">
              <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px auto' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#A61C2E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Control de Proceso
                </span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F2E4D', marginTop: '6px' }}>
                  Ingeniería en Soplado & Termoconformado
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(15,23,42,0.04)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#A61C2E', textTransform: 'uppercase' }}>Fase 01</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1F2E4D', margin: '10px 0' }}>Calentamiento Infrarrojo Modular</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6 }}>
                    Las preformas de resina PET 100% virgen entran en el túnel térmico con control independiente de zonas, asegurando plasticidad ideal y cuello PCO libre de deformación.
                  </p>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(15,23,42,0.04)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#A61C2E', textTransform: 'uppercase' }}>Fase 02</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1F2E4D', margin: '10px 0' }}>Soplado de Alta Presión (40 Bar)</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6 }}>
                    Estirado y soplado con aire filtrado libre de aceite en moldes de duraluminio CNC para obtener simetría axial, espesor uniforme y brillo cristalino.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* =========================================================================
          3. VISTA 2: CATÁLOGO DE ENVASES (CONECTADO EN VIVO A SUPABASE)
          ========================================================================= */}
      {(currentView === 'productos' || currentView === 'home') && (
        <section id="productos" style={{ padding: '70px 0', backgroundColor: '#F8FAFC' }}>
          <div className="container">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#A61C2E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Línea de Producción Oficial
                  </span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1F2E4D', marginTop: '4px' }}>
                    Catálogo Técnico de Envases
                  </h2>
                  <p style={{ fontSize: '14px', color: '#64748B' }}>
                    Especificaciones estandarizadas con boca PCO, gramaje exacto y pedido mínimo de fábrica.
                  </p>
                </div>

                {/* Buscador de Envases */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                  <input
                    type="text"
                    placeholder="Buscar envase, boca o ml..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                    }}
                  />
                  <Search style={{ position: 'absolute', left: '10px', top: '10px', width: '15px', height: '15px', color: '#94A3B8' }} />
                </div>
              </div>

              {/* Selector de Sectores / Tabs */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '12px 0 6px 0' }}>
                {[
                  { id: 'all', name: 'Todos los Sectores' },
                  { id: 'bebidas', name: '🥤 Bebidas & Alimentos' },
                  { id: 'farma_cosmetica', name: '🧴 Farma & Cosmética' },
                  { id: 'industrial', name: '🧪 Químicos & Agro' },
                ].map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setCurrentSector(s.id as any)}
                    className={`pet-tab ${currentSector === s.id ? 'active' : ''}`}
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              {/* Filtro de Categorías */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px 0 16px 0' }}>
                <button
                  type="button"
                  onClick={() => setCurrentCategory('all')}
                  className={`filter-pill ${currentCategory === 'all' ? 'active' : ''}`}
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <span>📦</span>
                  <span>Todos los Envases ({products.length})</span>
                </button>
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCurrentCategory(cat.slug || cat.id)}
                    className={`filter-pill ${currentCategory === (cat.slug || cat.id) ? 'active' : ''}`}
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    <span>{cat.slug === 'bebidas' ? '🥤' : cat.slug === 'farma' ? '💊' : cat.slug === 'cosmetica' ? '🧴' : cat.slug === 'quimicos' ? '🧪' : cat.slug === 'tapas' ? '🔘' : cat.slug === 'preformas' ? '⚙️' : '🍯'}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Productos Técnicos */}
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <Package style={{ width: '48px', height: '48px', color: '#94A3B8', margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1F2E4D' }}>No se encontraron referencias</h3>
                <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '400px', margin: '6px auto' }}>
                  No hay envases registrados en la base de datos que coincidan con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <div id="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {filteredProducts.map((p) => {
                  const specs = p.attributes?.specs || {};
                  const catObj = categories.find((c) => c.id === p.category_id);
                  const imageSrc = p.images?.[0] || '/assets/products/ayme-001.svg';

                  return (
                    <article key={p.id} className="product-card technical-b2b-card" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="product-card-media" style={{ position: 'relative', height: '220px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.attributes?.badge && (
                          <span className="product-badge" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                            {p.attributes.badge}
                          </span>
                        )}
                        <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '11px', fontFamily: 'monospace', color: '#64748B', fontWeight: 700 }}>
                          {p.sku}
                        </span>

                        <img
                          src={imageSrc}
                          alt={p.name}
                          style={{ maxHeight: '170px', maxWidth: '85%', objectFit: 'contain' }}
                          loading="lazy"
                        />

                        <button
                          type="button"
                          onClick={() => setSelectedProduct(p)}
                          className="btn-quick-view"
                          title="Ver Ficha Técnica"
                        >
                          Ficha Técnica & Plano
                        </button>
                      </div>

                      <div className="product-card-body" style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', backgroundColor: '#EEF2F8', color: '#1F2E4D', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            {catObj?.name || 'Envase'}
                          </span>
                          {specs.boca && (
                            <span style={{ fontSize: '10px', backgroundColor: '#FDF2F4', color: '#A61C2E', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              Boca: {specs.boca}
                            </span>
                          )}
                        </div>

                        <h4
                          onClick={() => setSelectedProduct(p)}
                          style={{ fontSize: '14px', fontWeight: 700, color: '#1F2E4D', lineHeight: 1.4, marginBottom: '8px', cursor: 'pointer' }}
                        >
                          {p.name}
                        </h4>

                        <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.description || 'Envase industrial de alto desempeño con certificación de inocuidad.'}
                        </p>

                        {/* Caja de Especificaciones Técnicas */}
                        <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#64748B' }}>Capacidad:</span>
                            <span style={{ fontWeight: 700, color: '#1F2E4D' }}>{specs.capacidad || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#64748B' }}>Gramaje:</span>
                            <span style={{ fontWeight: 700, color: '#1F2E4D' }}>{specs.gramaje || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Fardo de Fábrica:</span>
                            <span style={{ fontWeight: 700, color: '#1F2E4D' }}>{p.units_per_package || 100} uds</span>
                          </div>
                        </div>

                        {/* Botón de Cotización */}
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block', textTransform: 'uppercase' }}>Pedido Mínimo</span>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#A61C2E' }}>{p.min_order_qty || 500} uds</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleProductWhatsApp(p)}
                            className="btn btn-whatsapp"
                            style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer' }}
                          >
                            Cotizar WhatsApp
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          4. VISTA 3: SERVICIOS INDUSTRIALES
          ========================================================================= */}
      {(currentView === 'servicios' || currentView === 'home') && (
        <section id="servicios" style={{ padding: '70px 0', backgroundColor: '#ffffff', borderTop: '1px solid #E2E8F0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#A61C2E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Capacidad de Planta
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1F2E4D', marginTop: '6px' }}>
                Servicios de Maquila & Matricería
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B' }}>
                Infraestructura instalada en Llano Grande, Quito, para abastecer producciones continuas en todo el Ecuador.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
              <div style={{ padding: '32px', borderRadius: '18px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '16px' }}>🏭</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1F2E4D', marginBottom: '10px' }}>
                  Soplado e Inyección a Escala
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6 }}>
                  Líneas rotativas y lineales de alta velocidad para volúmenes superiores a 100.000 unidades mensuales con entrega programada por pallet.
                </p>
              </div>

              <div style={{ padding: '32px', borderRadius: '18px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '16px' }}>⚙️</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1F2E4D', marginBottom: '10px' }}>
                  Desarrollo de Moldes Personalizados
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6 }}>
                  Diseño CAD 3D de envases exclusivos con el logo o relieve de tu marca. Fabricación de moldes de soplado en duraluminio aeronáutico.
                </p>
              </div>

              <div style={{ padding: '32px', borderRadius: '18px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '16px' }}>🔬</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1F2E4D', marginBottom: '10px' }}>
                  Laboratorio de Calidad & Resistencia
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6 }}>
                  Pruebas de hermeticidad al vacío, resistencia a presión hidrostática (hasta 4.5 bar) y control de espesor por ultrasonido.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          5. VISTA 4: CONTACTO & UBICACIÓN DE PLANTA
          ========================================================================= */}
      {(currentView === 'contacto' || currentView === 'home') && (
        <section id="contacto" style={{ padding: '70px 0', backgroundColor: '#1F2E4D', color: '#ffffff' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Atención Directa de Fábrica
                </span>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', marginBottom: '16px', lineHeight: 1.2 }}>
                  Planta Industrial & Ventas Mayoristas
                </h2>
                <p style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: 1.6, marginBottom: '28px' }}>
                  Atendemos pedidos a nivel nacional con despacho en transporte propio o consolidado para industrias embotelladoras, farmacéuticas y químicas.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <MapPin style={{ width: '18px', height: '18px', color: '#38BDF8', flexShrink: 0, marginTop: '3px' }} />
                    <div>
                      <strong>Ubicación Planta:</strong>
                      <div style={{ color: '#94A3B8' }}>{landing.address || 'Llano Grande, Sector Calderón, Quito - Ecuador'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Phone style={{ width: '18px', height: '18px', color: '#34D399', flexShrink: 0, marginTop: '3px' }} />
                    <div>
                      <strong>Teléfono / WhatsApp:</strong>
                      <div style={{ color: '#94A3B8' }}>{mainPhone} / +593 99 872 2324</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Mail style={{ width: '18px', height: '18px', color: '#FBBF24', flexShrink: 0, marginTop: '3px' }} />
                    <div>
                      <strong>Correo Comercial:</strong>
                      <div style={{ color: '#94A3B8' }}>{landing.email || 'ventas@aymeindustriaspet.com'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Clock style={{ width: '18px', height: '18px', color: '#A78BFA', flexShrink: 0, marginTop: '3px' }} />
                    <div>
                      <strong>Horario de Operación:</strong>
                      <div style={{ color: '#94A3B8' }}>{landing.hours || 'Lunes a Viernes: 8:00 AM - 5:30 PM | Sábados: 8:30 AM - 1:00 PM'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Acción Rápida */}
              <div style={{ backgroundColor: '#141E33', padding: '36px', borderRadius: '24px', border: '1px solid #2A3E66', boxShadow: '0 16px 40px rgba(0,0,0,0.3)' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>¿Necesitas una cotización formal?</h3>
                <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px', lineHeight: 1.5 }}>
                  Escríbenos directamente indicando el modelo del envase, la cantidad requerida y la ciudad de entrega. Te respondemos de inmediato.
                </p>

                <button
                  type="button"
                  onClick={() => handleWhatsAppContact()}
                  className="btn btn-whatsapp btn-block"
                  style={{ padding: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Send style={{ width: '18px', height: '18px' }} />
                  <span>Chatear con un Asesor de Planta</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          6. MODAL DETALLADO DE FICHA TÉCNICA DE PRODUCTO
          ========================================================================= */}
      {selectedProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              position: 'relative',
              padding: '28px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
              }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div style={{ width: '160px', height: '180px', backgroundColor: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                <img
                  src={selectedProduct.images?.[0] || '/assets/products/ayme-001.svg'}
                  alt={selectedProduct.name}
                  style={{ maxHeight: '150px', maxWidth: '90%', objectFit: 'contain' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#A61C2E', textTransform: 'uppercase' }}>
                  {selectedProduct.sku}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1F2E4D', marginTop: '2px', marginBottom: '8px' }}>
                  {selectedProduct.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
                  {selectedProduct.description}
                </p>
              </div>
            </div>

            {/* Especificaciones Técnicas */}
            <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#1F2E4D', textTransform: 'uppercase', marginBottom: '10px' }}>
              Ficha Técnica de Molde & Fabricación
            </h4>
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '14px', border: '1px solid #E2E8F0', fontSize: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                {Object.entries(selectedProduct.attributes?.specs || {}).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EEF2F6', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748B', textTransform: 'capitalize' }}>{key}:</span>
                    <strong style={{ color: '#1F2E4D' }}>{String(val)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleProductWhatsApp(selectedProduct)}
              className="btn btn-whatsapp btn-block"
              style={{ padding: '12px', fontSize: '14px', cursor: 'pointer' }}
            >
              Cotizar este Envase por WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. FOOTER OFICIAL
          ========================================================================= */}
      <footer className="site-footer" style={{ backgroundColor: '#141E33', borderTop: '1px solid #2A3E66', padding: '40px 0', color: '#94A3B8', fontSize: '12px' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="/assets/logo.png" alt="AYME" style={{ height: '36px', filter: 'brightness(0) invert(1)' }} />
            <div>
              <div style={{ color: '#ffffff', fontWeight: 700 }}>AYME INDUSTRIAS PET - Solutions in Packaging</div>
              <div>© 2026 Todos los derechos reservados. Planta Quito, Ecuador.</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399' }}>
              <ShieldCheck style={{ width: '16px', height: '16px' }} />
              Inocuidad Certificada
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38BDF8' }}>
              <CheckCircle2 style={{ width: '16px', height: '16px' }} />
              Despachos Nacionales
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
