'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface AdminLoginFormProps {
  shopSlug: string;
  tenantName: string;
  onSuccess: () => void;
}

export default function AdminLoginForm({
  shopSlug,
  tenantName,
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
            Ingresa la clave de administración para <strong>{tenantName}</strong>
          </p>
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
