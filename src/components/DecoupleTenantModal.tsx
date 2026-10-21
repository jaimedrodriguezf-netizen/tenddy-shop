'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  FileJson,
  Layers,
  ArrowRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { SuperadminTenantSummary } from './SuperadminDashboardView';

interface DecoupleTenantModalProps {
  tenant: SuperadminTenantSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTenant: (tenantId: string, isDecoupled: boolean, decoupledUrl: string) => Promise<boolean>;
}

export default function DecoupleTenantModal({
  tenant,
  isOpen,
  onClose,
  onUpdateTenant,
}: DecoupleTenantModalProps) {
  const [isDecoupled, setIsDecoupled] = useState(false);
  const [decoupledUrl, setDecoupledUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadingFormat, setDownloadingFormat] = useState<'sql' | 'json' | null>(null);

  useEffect(() => {
    if (tenant) {
      setIsDecoupled(Boolean(tenant.is_decoupled));
      setDecoupledUrl(tenant.decoupled_url || '');
      setSaveSuccess(false);
      setErrorMessage('');
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const handleDownloadDump = async (format: 'sql' | 'json') => {
    try {
      setDownloadingFormat(format);
      setErrorMessage('');

      const res = await fetch(`/api/superadmin/tenants/export?tenant_id=${tenant.id}&format=${format}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al generar el archivo de exportación');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tenant.slug}-dedicated-dump-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo descargar el archivo.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const ok = await onUpdateTenant(tenant.id, isDecoupled, decoupledUrl);
      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage('No se pudieron guardar los cambios.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error guardando configuración de desacople.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-slate-100 relative space-y-6 max-h-[90vh] overflow-y-auto">
        {/* BOTÓN CERRAR */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER DEL MODAL */}
        <div className="flex items-start gap-3.5 border-b border-slate-800/80 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-mono font-semibold mb-1">
              <span>Tenant Graduation & Ejection</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Instancia Dedicada y Desacople: {tenant.name}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Slug: {tenant.slug} • {tenant.total_products} productos • {tenant.total_quotes} cotizaciones
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Configuración de desacople actualizada con éxito.</span>
          </div>
        )}

        {/* SECCIÓN 1: EXPORTACIÓN PARA BASE DEDICADA */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Download className="w-4 h-4 text-sky-400" />
              <span>1. Exportar Datos hacia Supabase Propio</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              Zero Vendor Lock-in
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Genera un dump atómico que extrae únicamente las filas pertenecientes a <strong className="text-white">{tenant.name}</strong> (tenants, dominios, sucursales, categorías, productos, clientes B2B y cotizaciones). Listo para importar en una base de datos PostgreSQL o Supabase independiente.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleDownloadDump('sql')}
              disabled={downloadingFormat !== null}
              className="w-full bg-slate-950 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-sky-500/20 rounded-xl py-2.5 px-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {downloadingFormat === 'sql' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Generando Dump SQL...</span>
                </>
              ) : (
                <>
                  <FileCode2 className="w-4 h-4" />
                  <span>Descargar Dump SQL (.sql)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleDownloadDump('json')}
              disabled={downloadingFormat !== null}
              className="w-full bg-slate-950 hover:bg-slate-800 text-purple-400 hover:text-purple-300 border border-purple-500/20 rounded-xl py-2.5 px-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {downloadingFormat === 'json' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Generando JSON...</span>
                </>
              ) : (
                <>
                  <FileJson className="w-4 h-4" />
                  <span>Descargar Paquete JSON (.json)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SECCIÓN 2: MODO DESACOPLADO Y REDIRECCIÓN */}
        <form onSubmit={handleSave} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>2. Modo Tienda Desacoplada (Redirección Externa)</span>
            </div>
            <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              isDecoupled
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {isDecoupled ? 'Desacoplada Activa' : 'Modo Estándar Tenddy'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Permite que la tienda opere en su propio servidor o landing personalizada (como el monorepo de AYME en el puerto 3001 o dominio dedicado). Al activarse, los clientes que visiten <span className="font-mono text-white">/store/{tenant.slug}</span> serán redirigidos a su portal propio.
          </p>

          <div className="pt-2 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDecoupled}
                onChange={(e) => setIsDecoupled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900"
              />
              <span className="text-xs font-semibold text-white">
                Activar Desacople (Redirigir tráfico público a la tienda personalizada)
              </span>
            </label>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-300 block">
                URL de Tienda Externa / Dominio Propio:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={decoupledUrl}
                  onChange={(e) => setDecoupledUrl(e.target.value)}
                  placeholder="Ej: https://aymeindustriaspet.com o http://localhost:3001"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono transition-colors"
                />
                {decoupledUrl && (
                  <a
                    href={decoupledUrl.startsWith('http') ? decoupledUrl : `https://${decoupledUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    title="Probar enlace"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Los administradores mantendrán acceso de auditoría en Tenddy con un banner de aviso.
              </p>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-900/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Guardar Configuración</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
