'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  FileText,
  AlertCircle,
  Loader2,
  Package
} from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { Tenant, Branch, getPackagingUnit } from '@/lib/types';
import { getProductPrimaryImage } from '@/lib/product-image';
import { buildEcuadorWhatsAppUrl } from '@/lib/ecuador-phone';
import { resolveStorefrontTokens, buildStorefrontThemeCSS } from '@/lib/theme-tokens';

interface CartDrawerProps {
  tenant: Tenant;
  branches: Branch[];
  selectedBranch: Branch | null;
  onSelectBranch: (branch: Branch) => void;
}

export default function CartDrawer({
  tenant,
  branches,
  selectedBranch,
  onSelectBranch,
}: CartDrawerProps) {
  const {
    items,
    isOpen,
    closeCart,
    updatePackageCount,
    removeItem,
    clearTenantCart,
  } = useCartStore();

  const [step, setStep] = useState<'items' | 'form' | 'success'>('items');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdQuoteNumber, setCreatedQuoteNumber] = useState<string | null>(null);
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string | null>(null);

  // Tokens de diseño y colores corporativos dinámicos
  const theme = (tenant.theme_config as any) || {};
  const tokens = useMemo(
    () => resolveStorefrontTokens(theme.primary_color, theme.secondary_color),
    [theme.primary_color, theme.secondary_color]
  );
  const themeStyles = useMemo(
    () => buildStorefrontThemeCSS(theme.primary_color, theme.secondary_color),
    [theme.primary_color, theme.secondary_color]
  );
  const isLanding = theme.store_template === 'landing';
  const drawerBg = isLanding && theme.landing_bg_color ? theme.landing_bg_color : (tenant.slug === 'ayme-pet' ? '#0a1128' : '#0f172a');
  const drawerHeaderBg = isLanding ? 'rgba(0, 0, 0, 0.45)' : '#020617';

  // Unidad de empaque mayorista dinámica
  const packagingUnit = React.useMemo(() => getPackagingUnit(tenant), [tenant]);
  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Formulario B2B
  const [formData, setFormData] = useState({
    customerName: '',
    companyName: '',
    taxId: '',
    phone: '',
    email: '',
    deliveryCity: '',
    deliveryAddress: '',
    notes: '',
  });

  // Aislamiento Multi-Tenant: solo renderizar y cotizar productos de esta tienda específica
  const tenantItems = useMemo(
    () => items.filter((item) => item.product.tenant_id === tenant.id),
    [items, tenant.id]
  );
  const totalUnits = useMemo(
    () => tenantItems.reduce((sum, item) => sum + item.quantity, 0),
    [tenantItems]
  );
  const totalPackages = useMemo(
    () => tenantItems.reduce((sum, item) => sum + item.packageCount, 0),
    [tenantItems]
  );
  const targetWhatsapp = selectedBranch?.phone_whatsapp || tenant.landing_config.whatsapp_default;

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone) {
      setErrorMsg('Nombre de contacto y teléfono / WhatsApp son requeridos.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Persistir en Supabase vía API interna
      const payload = {
        tenant_id: tenant.id,
        branch_id: selectedBranch?.id,
        customer_name: formData.customerName,
        company_name: formData.companyName,
        tax_id: formData.taxId,
        customer_phone: formData.phone,
        customer_email: formData.email,
        delivery_city: formData.deliveryCity,
        delivery_address: formData.deliveryAddress,
        notes: formData.notes,
        items: tenantItems.map((item) => ({
          product_id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          package_count: item.packageCount,
          units_per_package: item.product.units_per_package,
          total_units: item.quantity,
          selected_color: item.selectedColor,
          specs: item.product.attributes?.specs || {},
        })),
      };

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Error al guardar la cotización');
      }

      const quoteNo = resData.quote.quote_number;
      setCreatedQuoteNumber(quoteNo);
      setStep('success');

      // 2. Construir mensaje estructurado para WhatsApp
      let msg = `*SOLICITUD DE COTIZACIÓN B2B #${quoteNo}*\n`;
      msg += `🏢 *Empresa:* ${formData.companyName || 'No especificada'}\n`;
      msg += `👤 *Contacto:* ${formData.customerName}\n`;
      msg += `📞 *Teléfono:* ${formData.phone}\n`;
      if (formData.deliveryCity) msg += `📍 *Ciudad de Despacho:* ${formData.deliveryCity}\n`;
      if (selectedBranch) msg += `🏭 *Sucursal de Atención:* ${selectedBranch.name} (${selectedBranch.city})\n`;
      msg += `\n*DETALLE DE ENVASES SOLICITADOS:*\n`;

      tenantItems.forEach((item, idx) => {
        msg += `\n${idx + 1}. *${item.product.name}*\n`;
        msg += `   • Cantidad: *${item.quantity.toLocaleString()} uds* (${item.packageCount} ${item.packageCount === 1 ? packagingUnit.singular.toLowerCase() : packagingUnit.plural.toLowerCase()})\n`;
        if (item.selectedColor) msg += `   • Color: ${item.selectedColor}\n`;
        const specs = item.product.attributes?.specs;
        if (specs?.boca) msg += `   • Boca: ${specs.boca}\n`;
        if (specs?.gramaje) msg += `   • Gramaje: ${specs.gramaje}\n`;
      });

      if (formData.notes) {
        msg += `\n📝 *Observaciones:* ${formData.notes}\n`;
      }

      msg += `\n_Generado automáticamente desde el catálogo B2B de ${tenant.name}_`;

      // 3. Normalizar número ecuatoriano y construir WhatsApp URL segura
      const rawTargetPhone = selectedBranch?.phone_whatsapp || tenant.landing_config?.whatsapp_default || (tenant as any)?.phone_number || '';
      const waUrl = buildEcuadorWhatsAppUrl(rawTargetPhone, msg);
      setLastWhatsAppUrl(waUrl);

      try {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      } catch {
        // Fallback manejado por botón en pantalla de éxito (Safari/iOS)
      }
      clearTenantCart(tenant.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] overflow-hidden">
      {/* Backdrop oscuro con desenfoque */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div
          style={{
            ...themeStyles,
            backgroundColor: drawerBg,
            borderColor: tokens.primaryBorder,
          }}
          className="w-screen max-w-md border-l text-slate-100 flex flex-col shadow-2xl transition-colors"
        >
          {/* Header del Drawer */}
          <div
            style={{ backgroundColor: drawerHeaderBg, borderBottomColor: tokens.primaryBorder }}
            className="p-4 pt-5 sm:pt-4 border-b flex items-center justify-between backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: tokens.primaryLight, borderColor: tokens.primaryBorder }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
              >
                <Package className="w-5 h-5" style={{ color: tokens.primary }} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white leading-tight">Carrito Cotizador B2B</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {tenantItems.length} {tenantItems.length === 1 ? 'modelo' : 'modelos'} • {totalPackages} {totalPackages === 1 ? packagingUnit.singular.toLowerCase() : packagingUnit.plural.toLowerCase()} ({totalUnits.toLocaleString()} uds)
                </p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Cerrar cotizador"
              aria-label="Cerrar carrito cotizador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Sucursal en el Carrito */}
          <div className="px-4 py-2.5 bg-black/25 border-b border-white/10 text-xs flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" style={{ color: tokens.primary }} />
              Atender desde:
            </span>
            <select
              value={selectedBranch?.id}
              onChange={(e) => {
                const b = branches.find((item) => item.id === e.target.value);
                if (b) onSelectBranch(b);
              }}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.city} ({b.name.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Contenido según Step */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {step === 'items' && (
              <>
                {tenantItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
                      <Package className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">
                      El cotizador está vacío
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs">
                      Explora el catálogo y agrega los envases o tapas que necesites en bultos de fábrica.
                    </p>
                    <button
                      onClick={() => {
                        closeCart();
                        const cat = document.getElementById('catalog-section');
                        if (cat) cat.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{ backgroundColor: tokens.primary, color: tokens.primaryText }}
                      className="mt-2 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                    >
                      Ver Catálogo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tenantItems.map((item, idx) => {
                      const itemKey = item.id || `${item.product.id}__${idx}`;
                      const packSize = item.product.units_per_package || 100;
                      const minQty = item.product.min_order_qty || packSize;
                      const minPacks = Math.ceil(minQty / packSize);

                      return (
                        <div
                          key={itemKey}
                          className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 relative group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-lg bg-slate-900 flex items-center justify-center p-1.5 border border-slate-800 shrink-0">
                              <img
                                src={getProductPrimaryImage(item.product.images, tenant)}
                                alt={item.product.name}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                              <h4 className="font-semibold text-xs text-white truncate">
                                {item.product.name}
                              </h4>
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="text-[11px] font-mono font-medium" style={{ color: tokens.primary }}>
                                  SKU: {item.product.sku}
                                </span>
                                {item.selectedColor && (
                                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                                    {item.selectedColor}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {packSize} uds / {packagingUnit.singular.toLowerCase()} • MOQ: {minQty.toLocaleString()} uds
                              </div>
                            </div>
                            <button
                              onClick={() => removeItem(itemKey)}
                              className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 transition-colors p-1"
                              title="Quitar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Selector de Paquetes / Fardos */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
                              <button
                                onClick={() =>
                                  updatePackageCount(
                                    itemKey,
                                    Math.max(minPacks, item.packageCount - 1)
                                  )
                                }
                                disabled={item.packageCount <= minPacks}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold font-mono px-2 text-white">
                                {item.packageCount} {item.packageCount === 1 ? packagingUnit.singular.toLowerCase() : packagingUnit.plural.toLowerCase()}
                              </span>
                              <button
                                onClick={() =>
                                  updatePackageCount(
                                    itemKey,
                                    item.packageCount + 1
                                  )
                                }
                                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-bold text-emerald-400 font-mono">
                                {item.quantity.toLocaleString()} uds
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {step === 'form' && (
              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div
                  style={{
                    backgroundColor: tokens.primaryLight,
                    borderColor: tokens.primaryBorder,
                    color: '#f8fafc',
                  }}
                  className="border rounded-xl p-3 text-xs flex items-start gap-2"
                >
                  <Building2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: tokens.primary }} />
                  <span>
                    Completa los datos de tu empresa para enviar el requerimiento formal a la planta de <strong>{selectedBranch?.city}</strong>.
                  </span>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">
                      Nombre de Contacto *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({ ...formData, customerName: e.target.value })
                        }
                        placeholder="Ej. Ing. Carlos Mendoza"
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[var(--tenant-primary)] focus:ring-1 focus:ring-[var(--tenant-primary)] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">
                      Empresa / Razón Social
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData({ ...formData, companyName: e.target.value })
                        }
                        placeholder="Ej. Embotelladora Andina S.A."
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[var(--tenant-primary)] focus:ring-1 focus:ring-[var(--tenant-primary)] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">
                        WhatsApp / Celular *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="0998765432"
                          className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[var(--tenant-primary)] focus:ring-1 focus:ring-[var(--tenant-primary)] transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">
                        Ciudad Despacho
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                        <input
                          type="text"
                          value={formData.deliveryCity}
                          onChange={(e) =>
                            setFormData({ ...formData, deliveryCity: e.target.value })
                          }
                          placeholder="Ej. Guayaquil"
                          className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[var(--tenant-primary)] focus:ring-1 focus:ring-[var(--tenant-primary)] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="compras@empresa.com"
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[var(--tenant-primary)] focus:ring-1 focus:ring-[var(--tenant-primary)] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">
                      Notas Especiales (Color, Tiempo de entrega)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Color requerido, muestras previas, etc."
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-[var(--tenant-primary)] focus:ring-1 focus:ring-[var(--tenant-primary)] text-xs resize-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('items')}
                    className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        Enviar a WhatsApp
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {step === 'success' && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">¡Cotización Registrada!</h3>
                  <p className="text-xs font-mono mt-1 font-semibold" style={{ color: tokens.primary }}>
                    Número: {createdQuoteNumber}
                  </p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                  La solicitud se guardó en nuestra base de datos para la sucursal de <strong>{selectedBranch?.city || 'Planta'}</strong>.
                </p>

                {/* Botón directo de WhatsApp para Safari/iOS que bloquean aperturas emergentes tras fetch */}
                {lastWhatsAppUrl && (
                  <a
                    href={lastWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Abrir Conversación en WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStep('items');
                    closeCart();
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Continuar Explorando
                </button>
              </div>
            )}
          </div>

          {/* Footer del Drawer */}
          {step === 'items' && items.length > 0 && (
            <div
              style={{ backgroundColor: drawerHeaderBg, borderTopColor: tokens.primaryBorder }}
              className="p-4 border-t space-y-2.5 backdrop-blur-md"
            >
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Modelos en cotizador:</span>
                <span className="font-bold text-white text-xs">
                  {tenantItems.length} {tenantItems.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Total {packagingUnit.plural}:</span>
                <span className="font-bold" style={{ color: tokens.primary }}>
                  {totalPackages} {totalPackages === 1 ? packagingUnit.singular.toLowerCase() : packagingUnit.plural.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Total Unidades:</span>
                <span className="font-bold text-white text-sm">
                  {totalUnits.toLocaleString()} uds
                </span>
              </div>

              <button
                onClick={() => setStep('form')}
                style={{ backgroundColor: tokens.primary, color: tokens.primaryText }}
                className="w-full text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90 active:scale-[0.99] cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Continuar a Datos de Cotización
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
