'use client';

import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Check,
  Package,
  Sparkles,
  ArrowRight,
  Send,
  Building2,
  Lock,
  RotateCcw,
  X
} from 'lucide-react';

interface DemoProduct {
  id: string;
  name: string;
  category: 'plastics' | 'food' | 'packaging' | 'chemicals';
  categoryLabel: string;
  sku: string;
  basePrice: number;
  bulkPrice: number;
  discountBadge: string;
  moq: number;
  packageType: string;
  unitsPerPack: number;
  specs: string;
  tag: string;
  colorBg: string;
  colorBorder: string;
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'p1',
    name: 'Envase Galón Industrial 3785ml PET',
    category: 'plastics',
    categoryLabel: 'Envases & Plásticos',
    sku: 'PET-GAL-3785',
    basePrice: 1.20,
    bulkPrice: 0.85,
    discountBadge: '-29% x Pallet',
    moq: 10,
    packageType: 'Caja x 24 uds',
    unitsPerPack: 24,
    specs: 'Boca PCO 1881 • 120g • 35 PSI Presión',
    tag: 'Mayorista',
    colorBg: 'from-sky-500/10 to-indigo-500/10',
    colorBorder: 'border-sky-500/20',
  },
  {
    id: 'p2',
    name: 'Caja Máster Chocolates 500g B2B',
    category: 'food',
    categoryLabel: 'Alimentos & Confitería',
    sku: 'CONF-BOX-500',
    basePrice: 4.50,
    bulkPrice: 3.20,
    discountBadge: '-28% por Volumen',
    moq: 5,
    packageType: 'Caja Máster x 20 uds',
    unitsPerPack: 20,
    specs: 'Vida útil: 12 meses • Certificación BPM',
    tag: 'Distribuidor',
    colorBg: 'from-amber-500/10 to-orange-500/10',
    colorBorder: 'border-amber-500/20',
  },
  {
    id: 'p3',
    name: 'Caja Corrugada C-12 Doble Pared',
    category: 'packaging',
    categoryLabel: 'Empaques & Cajas',
    sku: 'BOX-CORR-C12',
    basePrice: 0.70,
    bulkPrice: 0.48,
    discountBadge: '-31% Escala 100+',
    moq: 50,
    packageType: 'Fardo x 25 uds',
    unitsPerPack: 25,
    specs: 'Carga máxima: 40kg • Cartón reciclado Kraft',
    tag: 'Industrial',
    colorBg: 'from-emerald-500/10 to-teal-500/10',
    colorBorder: 'border-emerald-500/20',
  },
  {
    id: 'p4',
    name: 'Detergente Industrial Multiuso 20L',
    category: 'chemicals',
    categoryLabel: 'Químicos & Limpieza',
    sku: 'CHEM-DET-20L',
    basePrice: 18.00,
    bulkPrice: 13.90,
    discountBadge: '-22% por Pallet',
    moq: 4,
    packageType: 'Bidón 20 Litros con precinto',
    unitsPerPack: 1,
    specs: 'Biodegradable • Grado hospitalario y fabril',
    tag: 'Institucional',
    colorBg: 'from-cyan-500/10 to-blue-500/10',
    colorBorder: 'border-cyan-500/20',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Todos los Sectores' },
  { id: 'plastics', label: 'Envases & Plásticos' },
  { id: 'food', label: 'Alimentos & Confitería' },
  { id: 'packaging', label: 'Empaques & Cajas' },
  { id: 'chemicals', label: 'Químicos & Limpieza' },
];

export default function InteractiveStorefrontDemo() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cart, setCart] = useState<Record<string, number>>({ p1: 10 }); // 10 fardos por defecto
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('Planta Calderón (Quito)');

  const filteredProducts = DEMO_PRODUCTS.filter((prod) => {
    const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (productId: string) => {
    const prod = DEMO_PRODUCTS.find((p) => p.id === productId);
    if (!prod) return;

    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + prod.moq,
    }));

    setJustAddedId(productId);
    setTimeout(() => {
      setJustAddedId((curr) => (curr === productId ? null : curr));
    }, 1200);
  };

  const handleReset = () => {
    setCart({ p1: 10 });
    setSelectedCategory('all');
    setSearchTerm('');
  };

  // Totales del carrito
  const totalItemsCount = Object.values(cart).reduce((acc, qty) => acc + qty, 0);
  const totalProductsCount = Object.keys(cart).length;
  const totalPrice = Object.entries(cart).reduce((acc, [id, qty]) => {
    const prod = DEMO_PRODUCTS.find((p) => p.id === id);
    if (!prod) return acc;
    return acc + qty * prod.bulkPrice * prod.unitsPerPack;
  }, 0);

  // Formato WhatsApp simulado
  const generateWhatsAppMessage = () => {
    const dateStr = new Date().toLocaleDateString('es-EC');
    let msg = `🏭 *SOLICITUD DE COTIZACIÓN FORMAL*\n`;
    msg += `📅 *Fecha:* ${dateStr}\n`;
    msg += `📍 *Sucursal / Despacho:* ${selectedBranch}\n`;
    msg += `🏢 *Cliente:* Distribuidora Nacional S.A.\n`;
    msg += `------------------------------------\n`;

    Object.entries(cart).forEach(([id, qty]) => {
      const prod = DEMO_PRODUCTS.find((p) => p.id === id);
      if (!prod) return;
      const subtotal = (qty * prod.bulkPrice * prod.unitsPerPack).toFixed(2);
      msg += `📦 *${prod.name}*\n`;
      msg += `   • Cantidad: ${qty} bultos (${qty * prod.unitsPerPack} uds)\n`;
      msg += `   • Precio Escala: $${prod.bulkPrice.toFixed(2)} / ud\n`;
      msg += `   • Subtotal: $${subtotal} USD\n\n`;
    });

    msg += `------------------------------------\n`;
    msg += `💵 *TOTAL ESTIMADO:* $${totalPrice.toFixed(2)} USD\n`;
    msg += `\n💬 *Mensaje generado automáticamente desde el catálogo digital.*`;
    return msg;
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Contenedor tipo Pantalla / Navegador de Dispositivo */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Barra Superior del Navegador Simulado */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline ml-2">
              Simulador en Vivo de Tienda Mayorista
            </span>
          </div>

          {/* Barra de Dirección URL Simulada */}
          <div className="flex-1 max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-slate-300 font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">https://distribuidora-valle.tenddy.shop</span>
            <span className="ml-auto text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded font-sans font-bold uppercase">
              Activa
            </span>
          </div>

          {/* Botón de reinicio de demo */}
          <button
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            title="Reiniciar simulador"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>

        {/* Cabecera Interna de la Tienda Simulada */}
        <div className="bg-slate-900/95 p-4 sm:p-5 border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-orange-500/20">
                DV
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-none">
                  DISTRIBUIDORA DEL VALLE
                </h3>
                <span className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3 text-sky-400" />
                  <span>Ventas Mayoristas por Fardo & Pallet • Despacho Nacional</span>
                </span>
              </div>
            </div>

            {/* Carrito / Cotizador Flotante Superior */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cotización:</span>
                <span className="bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-md text-[11px] font-mono">
                  {totalProductsCount} {totalProductsCount === 1 ? 'producto' : 'productos'}
                </span>
                <span className="text-xs font-mono font-extrabold hidden sm:inline">
                  ${totalPrice.toFixed(2)}
                </span>
              </button>
            </div>
          </div>

          {/* Banner Promocional de Alta Conversión */}
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 rounded-xl p-2.5 px-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Escalas por Pallet Completo habilitadas con descuentos de hasta el 31%</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
              Precios válidos en planta
            </span>
          </div>

          {/* Barra de Búsqueda y Categorías Dinámicas */}
          <div className="space-y-2.5 pt-1">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por producto, material, SKU o aplicación..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Píldoras de Categorías con scroll horizontal */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grilla Dinámica de Productos de Alta Conversión */}
        <div className="p-4 sm:p-6 bg-slate-950/70">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredProducts.map((prod) => {
              const inCartQty = cart[prod.id] || 0;
              const isJustAdded = justAddedId === prod.id;

              return (
                <div
                  key={prod.id}
                  className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all group ${
                    inCartQty > 0 ? 'border-amber-500/40' : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Badge Superior y Tag */}
                    <div className="flex items-center justify-between gap-1 mb-2.5">
                      <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        {prod.discountBadge}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {prod.sku}
                      </span>
                    </div>

                    {/* Preview Visual del Producto */}
                    <div className={`w-full h-24 rounded-xl bg-gradient-to-br ${prod.colorBg} border ${prod.colorBorder} flex flex-col items-center justify-center mb-3 relative overflow-hidden group-hover:scale-[1.02] transition-transform`}>
                      <Package className="w-8 h-8 text-slate-300 opacity-80 mb-1" />
                      <span className="text-[10px] font-semibold text-slate-300 text-center px-2 truncate w-full">
                        {prod.packageType}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white mb-1 leading-snug line-clamp-2">
                      {prod.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-snug mb-3">
                      {prod.specs}
                    </p>
                  </div>

                  {/* Precios por Escala y Botón de Acción */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 line-through mr-1.5">
                          ${prod.basePrice.toFixed(2)}
                        </span>
                        <span className="text-base font-extrabold text-white">
                          ${prod.bulkPrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-0.5">/ud</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        MOQ: {prod.moq} bultos
                      </span>
                    </div>

                    {/* Botón Táctil de Agregar al Pedido */}
                    <button
                      onClick={() => handleAddToCart(prod.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white'
                          : inCartQty > 0
                          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>¡Agregado al Pedido!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {inCartQty > 0
                              ? `Agregar +${prod.moq} (${inCartQty} en orden)`
                              : `Cotizar por Bulto (${prod.moq} min)`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra Flotante de Cierre de Cotización (Call to Action en Vivo) */}
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Orden lista con {totalItemsCount} bultos ({totalProductsCount} productos)</span>
                  <span className="text-emerald-400 font-mono text-sm font-extrabold">
                    ${totalPrice.toFixed(2)} USD
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Calculada con descuentos por escala mayorista y lista para WhatsApp.
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Ver Mensaje de WhatsApp que Recibe la Fábrica</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Preview de la Orden de WhatsApp */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm text-white">
                  Mensaje que Recibe tu Asesor en WhatsApp
                </h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Sucursal */}
            <div className="space-y-1 text-xs">
              <label className="text-slate-400 font-medium">Sucursal o Planta de despacho:</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="Planta Calderón (Quito)">Planta Calderón (Quito) — WhatsApp Asesor 1</option>
                <option value="CEDI Guayaquil (Vía Daule)">CEDI Guayaquil (Vía Daule) — WhatsApp Asesor 2</option>
                <option value="Bodega Cuenca (Parque Industrial)">Bodega Cuenca — WhatsApp Asesor 3</option>
              </select>
            </div>

            {/* Cuadro de Chat Simulado de WhatsApp */}
            <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-2xl p-4 font-mono text-xs text-emerald-200/90 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {generateWhatsAppMessage()}
            </div>

            <div className="pt-2 text-[11px] text-slate-400 text-center">
              Así de simple: tus clientes eligen por fardo o caja y te llega la orden con SKU y volúmenes calculados.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Simulación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
