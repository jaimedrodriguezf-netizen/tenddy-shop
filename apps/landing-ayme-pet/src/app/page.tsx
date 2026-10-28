'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
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
  Boxes,
  FileText,
  SlidersHorizontal,
  Search,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { buildStorefrontThemeCSS } from '@/lib/theme-tokens';
import { resolveLandingSections, LandingSectionsConfig } from '@/lib/types';

interface AymeLandingProps {
  initialSections?: Partial<LandingSectionsConfig>;
}

// Catálogo oficial de envases y preformas de AYME INDUSTRIAS PET con cotas técnicas de ingeniería
const AYME_PRODUCTS = [
  {
    id: 'ayme-yogurt-500',
    sku: 'AYME-YOG-500',
    name: 'Botella Ergonómica 500ml Yogurt / Jugo',
    category: 'Línea Láctea & Bebidas',
    type: 'botellas',
    neck: 'Rosca 38mm / 28mm PCO con Tapa',
    weight: '28g',
    height: '195.0 mm ± 1.0mm',
    diameter: '62.0 mm (Cintura anatómica)',
    packaging: '100 uds / fardo',
    palletQty: '3.600 uds / palet americano',
    image: '/assets/products/yogurt-500ml/1793204589665.jpg',
    formValue: 'Botella Ergonómica 500ml Yogurt',
    description: 'Envase plástico ergonómico de fácil agarre para yogurt, lácteos, jugos y néctares pasteurizados.',
  },
  {
    id: 'ayme-osito',
    sku: 'AYME-OSITO-250',
    name: 'Envase / Botella Infantil Osito 250ml',
    category: 'Línea Infantil & Novedades',
    type: 'botellas',
    neck: 'Rosca 28mm Infantil',
    weight: '26g',
    height: '145.0 mm ± 1.0mm',
    diameter: '55.0 mm',
    packaging: '100 uds / fardo',
    palletQty: '4.000 uds / palet americano',
    image: '/assets/products/osito-250ml/1793203704250.jpg',
    videoUrl: '/assets/products/videos/osito-250ml.mp4',
    formValue: 'Botella Infantil Osito 250ml',
    description: 'Envase plástico PET con relieve 3D figura de osito para confitería, miel de abeja, jugos infantiles y dulces.',
  },
  {
    id: 'ayme-galonera-500',
    sku: 'AYME-GAL500-45',
    name: 'Galonera PET 500ml con Asa',
    category: 'Línea Químicos & Limpieza',
    type: 'galones',
    neck: 'Rosca 28mm PCO / 38mm',
    weight: '45g',
    height: '160.0 mm ± 1.5mm',
    diameter: '80.0 mm',
    packaging: '100 uds / fardo',
    palletQty: '2.500 uds / palet americano',
    image: '/assets/products/ayme-003.svg',
    videoUrl: '/assets/products/videos/galonera-500ml.mp4',
    formValue: 'Galonera PET 500ml',
    description: 'Galonera compacta con asa ergonómica reforzada para lubricantes, químicos, desinfectantes y agroquímicos.',
  },
  {
    id: 'ayme-001',
    sku: 'AYME-B500-24',
    name: 'Botella PET 500ml Cilíndrica',
    category: 'Línea Bebidas & Alimentos',
    type: 'botellas',
    neck: 'Rosca 28mm PCO 1881',
    weight: '24g / 28g',
    height: '210.5 mm ± 1.5mm',
    diameter: '65.0 mm ± 1.0mm',
    packaging: '150 uds / fardo termocontraíble',
    palletQty: '3.600 uds / palet americano (1.0 x 1.2 m)',
    image: '/assets/products/ayme-001.svg',
    formValue: 'Botella PET 500ml',
    description: 'Envase de alta resistencia y transparencia cristal para jugos, aguas, lácteos y vinagres.',
  },
  {
    id: 'ayme-002',
    sku: 'AYME-B1000-32',
    name: 'Botella PET 1 Litro Estándar',
    category: 'Línea Granel & Líquidos',
    type: 'botellas',
    neck: 'Rosca 28mm PCO',
    weight: '32g / 36g',
    height: '265.0 mm ± 2.0mm',
    diameter: '82.0 mm ± 1.2mm',
    packaging: '100 uds / fardo termocontraíble',
    palletQty: '2.400 uds / palet americano',
    image: '/assets/products/ayme-002.svg',
    formValue: 'Botella PET 1 Litro',
    description: 'Diseño anatómico con estrías de compresión vertical para embotellado continuo en planta.',
  },
  {
    id: 'ayme-003',
    sku: 'AYME-G3800-95',
    name: 'Galón PET 3.8L Industrial',
    category: 'Línea Químicos & Limpieza',
    type: 'galones',
    neck: 'Rosca 38mm / Asa Reforzada',
    weight: '85g - 110g',
    height: '315.0 mm ± 2.5mm',
    diameter: '155.0 mm ± 2.0mm',
    packaging: '24 uds / bulto paletizado',
    palletQty: '480 uds / palet americano',
    image: '/assets/products/ayme-003.svg',
    formValue: 'Galón PET 3.8 Litros',
    description: 'Garrafa con asa ergonómica reforzada para cloro, detergentes, aceites y desinfectantes.',
  },
  {
    id: 'ayme-004',
    sku: 'AYME-B250-18',
    name: 'Botella PET 250ml Cuadrada',
    category: 'Línea Cosmética & Farma',
    type: 'botellas',
    neck: 'Rosca 28mm',
    weight: '18g / 22g',
    height: '148.0 mm ± 1.0mm',
    diameter: '50.0 x 50.0 mm (Base cuadrada)',
    packaging: '200 uds / fardo',
    palletQty: '4.800 uds / palet',
    image: '/assets/products/ayme-004.svg',
    formValue: 'Botella PET 250ml Cuadrada',
    description: 'Formato premium de caras planas ideal para etiquetado frontal completo y termoencogible.',
  },
  {
    id: 'ayme-005',
    sku: 'AYME-F500-63',
    name: 'Frasco PET 500ml Boca Ancha',
    category: 'Línea Alimentos & Sólidos',
    type: 'frascos',
    neck: 'Rosca 63mm / 70mm',
    weight: '30g / 35g',
    height: '125.0 mm ± 1.2mm',
    diameter: '85.0 mm ± 1.0mm',
    packaging: '120 uds / fardo',
    palletQty: '2.880 uds / palet',
    image: '/assets/products/ayme-005.svg',
    formValue: 'Frasco PET 500ml Boca Ancha',
    description: 'Frasco transparente ideal para confitería, salsas espesas, cápsulas y frutos secos.',
  },
  {
    id: 'ayme-006',
    sku: 'AYME-B1500-42',
    name: 'Botella PET 1.5L Familiar',
    category: 'Línea Bebidas Carbonatadas',
    type: 'botellas',
    neck: 'Rosca 28mm PCO',
    weight: '42g',
    height: '305.0 mm ± 2.0mm',
    diameter: '92.0 mm ± 1.5mm',
    packaging: '80 uds / fardo',
    palletQty: '1.920 uds / palet',
    image: '/assets/products/ayme-006.svg',
    formValue: 'Botella PET 1.5L Familiar',
    description: 'Base petaloide de alta tolerancia a presiones internas de gasificado y empaque paletizado.',
  },
  {
    id: 'ayme-007',
    sku: 'AYME-PREF-28',
    name: 'Preformas PET 24g - 42g',
    category: 'Materia Prima Grado Alimento',
    type: 'preformas-tapas',
    neck: 'Cuello PCO 1881 / 1810',
    weight: '24g a 42g',
    height: 'Longitudes variables 90 - 130 mm',
    diameter: 'Espesor de pared 3.5 - 4.2 mm',
    packaging: 'Cajas octogonales (Octabin) 10.000 uds',
    palletQty: '1 Octabin por palet (aprox. 450 kg)',
    image: '/assets/products/ayme-007.svg',
    formValue: 'Preformas & Tapas',
    description: 'Inyectadas en resina PET 100% virgen certificada para soplado industrial en planta propia.',
  },
  {
    id: 'ayme-008',
    sku: 'AYME-TAP-28',
    name: 'Tapas de Seguridad y Liners PP',
    category: 'Accesorios & Cierres',
    type: 'preformas-tapas',
    neck: '28mm / 38mm / 63mm',
    weight: 'Polipropileno Copolímero',
    height: 'Perfil bajo PCO 1881 / Estándar',
    diameter: 'Ajuste de torque calibrado',
    packaging: 'Cajas corrugadas 5.000 uds con funda plástica interna',
    palletQty: '24 cajas por palet (120.000 tapas)',
    image: '/assets/products/ayme-008.svg',
    formValue: 'Preformas & Tapas',
    description: 'Cierre hermético con anillo precinto de seguridad inviolable y liners de inducción térmica.',
  },
];

// Preguntas frecuentes industriales B2B
const AYME_FAQS = [
  {
    q: '¿Cuál es el pedido mínimo (MOQ) para envases en stock y bajo pedido?',
    a: 'Para referencias estándar en stock despachamos desde 1 fardo (80 a 200 unidades según el modelo). Para corridas de producción a gran escala con precios mayoristas de planta, el mínimo sugerido es de 1.000 a 5.000 unidades.',
  },
  {
    q: '¿Realizan despachos paletizados a provincias fuera de Pichincha / Quito?',
    a: 'Sí, despachamos a todo el territorio ecuatoriano a través de logística de carga paletizada protegida con film termoencogible, o mediante retiro directo en la bodega de nuestra planta en Calderón.',
  },
  {
    q: '¿Los envases cuentan con certificaciones de inocuidad y grado alimenticio?',
    a: '100% sí. Empleamos exclusivamente resina PET y PP 100% virgen con certificados internacionales de no migración química, aptos para contacto directo con alimentos, bebidas, fármacos y cosméticos.',
  },
  {
    q: '¿Pueden fabricar un molde exclusivo con diseño y logo propio de mi marca?',
    a: 'Por supuesto. Nuestro departamento de ingeniería realiza modelado 3D CAD/CAM paramétrico, prototipado y mecanizado CNC en aluminio aeronáutico para matrices de 1 a 4 cavidades.',
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

  // Scroll Spy: sección activa en navegación
  const [activeSection, setActiveSection] = useState('inicio');

  // Filtrado y búsqueda de catálogo
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal B2B de Ficha Técnica
  const [technicalModalProduct, setTechnicalModalProduct] = useState<(typeof AYME_PRODUCTS)[number] | null>(null);

  // Acordeón de FAQs
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Feedback visual al cotizar un producto
  const [highlightForm, setHighlightForm] = useState(false);

  // Navegación secuencial en Modal de Ficha Técnica
  const openProductModal = (prod: (typeof AYME_PRODUCTS)[number]) => {
    setTechnicalModalProduct(prod);
    try {
      if (typeof window !== 'undefined') {
        window.history.pushState({ modal: 'product', id: prod.id }, '', '#catalogo');
      }
    } catch {}
  };

  const handlePrevProduct = () => {
    if (!technicalModalProduct) return;
    const currentIndex = AYME_PRODUCTS.findIndex((p) => p.id === technicalModalProduct.id);
    const prevIndex = (currentIndex - 1 + AYME_PRODUCTS.length) % AYME_PRODUCTS.length;
    setTechnicalModalProduct(AYME_PRODUCTS[prevIndex]);
  };

  const handleNextProduct = () => {
    if (!technicalModalProduct) return;
    const currentIndex = AYME_PRODUCTS.findIndex((p) => p.id === technicalModalProduct.id);
    const nextIndex = (currentIndex + 1) % AYME_PRODUCTS.length;
    setTechnicalModalProduct(AYME_PRODUCTS[nextIndex]);
  };

  // Escuchar teclas para modal (Esc para cerrar, flechas para hojear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTechnicalModalProduct(null);
      } else if (e.key === 'ArrowLeft' && technicalModalProduct) {
        handlePrevProduct();
      } else if (e.key === 'ArrowRight' && technicalModalProduct) {
        handleNextProduct();
      }
    };
    const handlePopState = () => {
      if (technicalModalProduct) {
        setTechnicalModalProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [technicalModalProduct]);

  useEffect(() => {
    let prevY = window.scrollY;

    const handleScrollEvents = () => {
      const currentY = window.scrollY;
      const diff = currentY - prevY;

      // Smart Header: visibilidad y opacidad
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

      // Scroll Spy: detección de sección activa
      const sectionIds = ['inicio', 'catalogo', 'faqs', 'cotizar'];
      const scrollThreshold = currentY + 160;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollThreshold) {
          setActiveSection(id);
          break;
        }
      }

      prevY = currentY;
    };

    window.addEventListener('scroll', handleScrollEvents, { passive: true });
    handleScrollEvents();
    return () => window.removeEventListener('scroll', handleScrollEvents);
  }, []);

  const mainWhatsapp = '593998722324';
  const displayPhone = '099 872 2324';

  const handleSelectProductAndQuote = (productName: string) => {
    setContactProduct(productName);
    setTechnicalModalProduct(null);
    setHighlightForm(true);

    const target = document.getElementById('cotizar');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }

    setTimeout(() => {
      setHighlightForm(false);
    }, 2800);
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

  const filteredProducts = AYME_PRODUCTS.filter((prod) => {
    const matchesCategory = selectedCategoryTab === 'all' || prod.type === selectedCategoryTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      prod.name.toLowerCase().includes(q) ||
      prod.sku.toLowerCase().includes(q) ||
      prod.neck.toLowerCase().includes(q) ||
      prod.category.toLowerCase().includes(q) ||
      prod.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="inicio" style={themeStyles} className="min-h-screen bg-[#0a1128] text-slate-100 font-sans selection:bg-[#A61C2E] selection:text-white">
      {/* 1 & 2. CABECERA FLOTANTE CON SMART HIDE Y SCROLL SPY */}
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

              {/* Navegación Desktop con Scroll Spy Reactivo */}
              <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className={`transition-colors cursor-pointer py-1 relative ${
                    activeSection === 'inicio' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Inicio
                  {activeSection === 'inicio' && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#A61C2E] rounded-full" />
                  )}
                </button>
                <a
                  href="#catalogo"
                  className={`transition-colors py-1 relative ${
                    activeSection === 'catalogo' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Catálogo de Envases
                  {activeSection === 'catalogo' && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#A61C2E] rounded-full" />
                  )}
                </a>
                <a
                  href="#faqs"
                  className={`transition-colors py-1 relative ${
                    activeSection === 'faqs' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Preguntas Frecuentes
                  {activeSection === 'faqs' && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#A61C2E] rounded-full" />
                  )}
                </a>
                {sections.rfq_and_map.enabled && (
                  <a
                    href="#cotizar"
                    className={`transition-colors py-1 relative ${
                      activeSection === 'cotizar' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cotizar & Planta
                    {activeSection === 'cotizar' && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#A61C2E] rounded-full" />
                    )}
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

            {/* Menú Drawer Móvil con Resaltado de Sección */}
            {isMobileMenuOpen && (
              <div className="lg:hidden bg-[#060c1d]/98 backdrop-blur-xl border-t border-white/10 px-4 py-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                    activeSection === 'inicio' ? 'bg-[#A61C2E]/25 text-white border-l-2 border-[#A61C2E]' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  🏭 Inicio
                </button>
                <a
                  href="#catalogo"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                    activeSection === 'catalogo' ? 'bg-[#A61C2E]/25 text-white border-l-2 border-[#A61C2E]' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  📦 Catálogo de Envases
                </a>
                <a
                  href="#faqs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                    activeSection === 'faqs' ? 'bg-[#A61C2E]/25 text-white border-l-2 border-[#A61C2E]' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  ❓ Preguntas Frecuentes
                </a>
                {sections.rfq_and_map.enabled && (
                  <a
                    href="#cotizar"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                      activeSection === 'cotizar' ? 'bg-[#A61C2E]/25 text-white border-l-2 border-[#A61C2E]' : 'text-slate-300 hover:bg-white/10'
                    }`}
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

      {/* SECCIÓN DE CATÁLOGO DE ENVASES PET CON TABS Y BUSCADOR (#catalogo con scroll-mt-24) */}
      <section id="catalogo" className="scroll-mt-24 py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-8 border-b border-white/10">
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

        {/* BARRA DE BÚSQUEDA Y TABS DE FILTRADO POR CATEGORÍA */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Input de Búsqueda Reactiva */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU (ej: B500), tipo de rosca (ej: 28mm) o aplicación..."
              className="w-full bg-[#060c1d] border border-white/15 rounded-2xl pl-11 pr-10 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A61C2E] shadow-xl transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full bg-white/10"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tabs de Selección Rápida */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryTab === 'all'
                  ? 'bg-[#A61C2E] text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span>Todos los Modelos</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px] font-mono">8</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategoryTab('botellas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryTab === 'botellas'
                  ? 'bg-[#A61C2E] text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span>Botellas PET</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px] font-mono">4</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategoryTab('galones')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryTab === 'galones'
                  ? 'bg-[#A61C2E] text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span>Galones Industriales</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px] font-mono">1</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategoryTab('frascos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryTab === 'frascos'
                  ? 'bg-[#A61C2E] text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span>Frascos Boca Ancha</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px] font-mono">1</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategoryTab('preformas-tapas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryTab === 'preformas-tapas'
                  ? 'bg-[#A61C2E] text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span>Preformas & Tapas</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px] font-mono">2</span>
            </button>
          </div>
        </div>

        {/* GRILLA DE PRODUCTOS FILTRADOS */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-[#060c1d] border border-white/10 rounded-3xl p-8 space-y-3 max-w-lg mx-auto">
            <Package className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No encontramos modelos con ese criterio</h4>
            <p className="text-xs text-slate-400">Prueba con otro término de búsqueda o limpia los filtros.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryTab('all');
              }}
              className="text-xs text-[#A61C2E] underline font-bold"
            >
              Restablecer catálogo completo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {filteredProducts.map((prod) => (
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
                    {(prod as any).videoUrl && (
                      <span className="absolute bottom-2 left-2 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                        <span>▶</span>
                        <span>Video 360°</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-red-400 font-bold">{prod.category}</span>
                      <span className="text-slate-500">{prod.sku}</span>
                    </div>
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

                {/* Botones de acción: Ficha Técnica y Cotizar */}
                <div className="mt-4 pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => openProductModal(prod)}
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold py-2 px-3 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#A61C2E]" />
                    <span>Ver Plano & Medidas</span>
                  </button>

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
        )}
      </section>

      {/* 4. PILARES DE RESPALDO (Retirada por requerimiento de cliente) */}
      {sections.pillars.enabled && false && null}

      {/* SECCIÓN DE PREGUNTAS FRECUENTES B2B (#faqs con scroll-mt-24) */}
      <section id="faqs" className="scroll-mt-24 py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 border-b border-white/10">
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-mono font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Resolución de Dudas Comerciales</span>
          </span>
          <h3 className="text-2xl sm:text-4xl font-black text-white">
            Preguntas Frecuentes de Fabricación
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Condiciones de despacho, pedidos mínimos y estándares de inocuidad en nuestra planta de Calderón.
          </p>
        </div>

        <div className="space-y-3">
          {AYME_FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#060c1d] border border-white/10 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-sm text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#A61C2E]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    <p>{faq.a}</p>
                    <div className="mt-3">
                      <a
                        href="#cotizar"
                        className="text-[#A61C2E] hover:underline font-bold text-xs inline-flex items-center gap-1"
                      >
                        <span>¿Tienes una consulta específica? Contáctanos en el formulario</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FORMULARIO B2B Y MAPA DE PLANTA (#cotizar con scroll-mt-24 y feedback reactivo) */}
      {sections.rfq_and_map.enabled && (
        <section id="cotizar" className="scroll-mt-24 py-16 px-4 sm:px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Formulario */}
          {sections.rfq_and_map.show_form && (
            <div
              className={`bg-[#060c1d] border p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 transition-all duration-500 ${
                highlightForm
                  ? 'border-[#A61C2E] ring-4 ring-[#A61C2E]/30 scale-[1.01]'
                  : 'border-white/15'
              }`}
            >
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  <span>{sections.rfq_and_map.title || 'Solicitud de Cotización & Muestras'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {sections.rfq_and_map.subtitle || 'Atención directa de fábrica para pedidos por fardo, bulto o contenedor.'}
                </p>

                {/* Banner de feedback al seleccionar producto */}
                {highlightForm && (
                  <div className="mt-3 bg-red-500/20 border border-red-500/40 text-red-200 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span>
                      Modelo seleccionado: <strong>{contactProduct}</strong>. Completa tus datos para enviarte la propuesta.
                    </span>
                  </div>
                )}
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
                      className={`w-full bg-[#0a1128] border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#A61C2E] transition-colors ${
                        highlightForm ? 'border-[#A61C2E] bg-[#A61C2E]/10' : 'border-white/15'
                      }`}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#A61C2E]" />
                    <span>{sections.rfq_and_map.map_title || 'Ubicación de Planta & Retiro Directo'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Sector Calderón - Llano Grande, Quito, Ecuador.
                  </p>
                </div>

                {/* Botón de Ruta GPS en Google Maps / Waze */}
                <a
                  href={
                    sections.rfq_and_map.map_embed_url && sections.rfq_and_map.map_embed_url.includes('maps.app.goo.gl')
                      ? sections.rfq_and_map.map_embed_url
                      : "https://maps.google.com/?q=-0.115479,-78.441504"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold border border-red-500/30 transition-all hover:scale-105"
                  title="Abrir en GPS"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Trazar ruta GPS</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="h-72 w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                <iframe
                  title="Ubicación AYME INDUSTRIAS PET"
                  src={
                    sections.rfq_and_map.map_embed_url && !sections.rfq_and_map.map_embed_url.includes('maps.app.goo.gl') && !sections.rfq_and_map.map_embed_url.includes('goo.gl') && sections.rfq_and_map.map_embed_url.includes('embed')
                      ? sections.rfq_and_map.map_embed_url
                      : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15959.278385012543!2d-78.441504!3d-0.115479!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d58fb442f4625b%3A0xe5438843c08f654b!2sLlano%20Grande%2C%20Quito!5e0!3m2!1ses!2sec!4v1700000000000!5m2!1ses!2sec"
                  }
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

      {/* MODAL B2B DE FICHA TÉCNICA Y ESPECIFICACIONES CON NAVEGACIÓN SECUENCIAL */}
      {technicalModalProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setTechnicalModalProduct(null)}
        >
          <div
            className="bg-[#060c1d] border border-white/20 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal con Controles de Navegación Secuencial */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-red-400 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                    Ficha Técnica • SKU: {technicalModalProduct.sku}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Modelo {AYME_PRODUCTS.findIndex((p) => p.id === technicalModalProduct.id) + 1} de {AYME_PRODUCTS.length}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {technicalModalProduct.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {technicalModalProduct.category}
                </p>
              </div>

              {/* Controles: Anterior, Siguiente y Cerrar */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevProduct}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title="Modelo anterior (Flecha Izquierda)"
                  aria-label="Modelo anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextProduct}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title="Modelo siguiente (Flecha Derecha)"
                  aria-label="Modelo siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTechnicalModalProduct(null)}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer ml-1"
                  aria-label="Cerrar modal (Escape)"
                  title="Cerrar (Escape)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contenido: Imagen / Video + Tabla de Medidas de Ingeniería */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="relative aspect-square rounded-2xl bg-slate-900/90 border border-white/10 p-2 flex items-center justify-center overflow-hidden">
                {(technicalModalProduct as any).videoUrl ? (
                  <video
                    src={(technicalModalProduct as any).videoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <img
                    src={technicalModalProduct.image}
                    alt={technicalModalProduct.name}
                    className="max-h-full max-w-full object-contain p-4"
                  />
                )}
              </div>

              <div className="space-y-3 text-xs font-mono">
                <h4 className="text-white font-sans font-bold text-sm border-b border-white/10 pb-1 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-[#A61C2E]" />
                  <span>Especificaciones de Planta</span>
                </h4>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Rosca / Cuello:</span>
                    <span className="text-white font-bold">{technicalModalProduct.neck}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Gramaje de Resina:</span>
                    <span className="text-white font-bold">{technicalModalProduct.weight}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Altura Total:</span>
                    <span className="text-white font-bold">{technicalModalProduct.height}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Diámetro de Cuerpo:</span>
                    <span className="text-white font-bold">{technicalModalProduct.diameter}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Embalaje por Fardo:</span>
                    <span className="text-emerald-400 font-bold">{technicalModalProduct.packaging}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paletizado Oficial:</span>
                    <span className="text-yellow-300 font-bold">{technicalModalProduct.palletQty}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones del Modal */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleSelectProductAndQuote(technicalModalProduct.formValue)}
                className="w-full sm:flex-1 bg-[#A61C2E] hover:bg-[#8C1625] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Solicitar Cotización de este Modelo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`https://wa.me/${mainWhatsapp}?text=${encodeURIComponent(
                  `¡Hola AYME INDUSTRIAS PET! Requiero cotización formal y ficha técnica del modelo: ${technicalModalProduct.name} (SKU: ${technicalModalProduct.sku}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Rápido</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* WIDGET FLOTANTE OMNICANAL: BOTÓN VOLVER ARRIBA Y BOTÓN WHATSAPP */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Botón Volver Arriba */}
        {isHeaderSolid && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-slate-800/90 hover:bg-slate-700 text-white p-3 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 border border-white/20 cursor-pointer"
            aria-label="Volver arriba"
            title="Volver arriba"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}

        {/* Botón WhatsApp Flotante Permanente */}
        <a
          href={`https://wa.me/${mainWhatsapp}?text=${encodeURIComponent(
            '¡Hola AYME INDUSTRIAS PET! Deseo consultar disponibilidad de envases y precios mayoristas de planta.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-white/20 group"
          title="Contactar a Ventas en Planta"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300" />
          </span>
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">WhatsApp Planta ({displayPhone})</span>
        </a>
      </div>

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
            <a href="#catalogo" className="hover:text-white transition-colors">
              Catálogo de Envases
            </a>
            <a href="#faqs" className="hover:text-white transition-colors">
              Preguntas Frecuentes
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
