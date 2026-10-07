'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, Loader2, ArrowRight, LogOut } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';

interface AdminLoginFormProps {
  shopSlug: string;
  tenantName: string;
  activeGoogleEmail?: string | null;
  onSignOutGoogle?: () => Promise<void>;
  onSuccess: () => void;
}

export default function AdminLoginForm({
  shopSlug,
  tenantName,
  activeGoogleEmail,
  onSignOutGoogle,
  onSuccess,
}: AdminLoginFormProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, shopSlug }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Clave de acceso incorrecta');
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error autenticando');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-sm bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm text-slate-900 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto text-white shadow-sm font-bold text-base">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Acceso Administrativo B2B</h2>
          <p className="text-xs text-slate-500">
            Ingresa a la administración de <strong>{tenantName}</strong>
          </p>
        </div>

        {/* Aviso de cuenta Google activa sin permisos en esta tienda */}
        {activeGoogleEmail && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl text-xs space-y-2.5 shadow-2xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-amber-950">
                  Sesión activa de Google: <span className="font-mono text-amber-800 break-all">{activeGoogleEmail}</span>
                </p>
                <p className="text-[11px] text-amber-700 leading-snug">
                  Esta cuenta no está registrada como administradora de <strong>{tenantName}</strong>.
                </p>
              </div>
            </div>
            {onSignOutGoogle && (
              <button
                type="button"
                onClick={onSignOutGoogle}
                className="w-full py-2 px-3 bg-white hover:bg-amber-100/70 border border-amber-300 rounded-xl text-amber-900 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-700" />
                <span>Cerrar sesión de Google / Cambiar de cuenta</span>
              </button>
            )}
          </div>
        )}

        {/* Botón de Iniciar Sesión con Google */}
        <div className="space-y-3">
          <GoogleSignInButton
            redirectTo={`/store/${shopSlug}/admin`}
            label={activeGoogleEmail ? "Cambiar cuenta de Google" : "Entrar con Google"}
          />
          <div className="relative text-center my-3">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <span className="relative bg-white px-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">O usa tu clave master</span>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Clave de Acceso Master
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Ingresar al Backoffice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
