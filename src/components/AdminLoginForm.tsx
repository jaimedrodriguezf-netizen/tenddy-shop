'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Acceso Administrativo B2B</h2>
          <p className="text-xs text-slate-400">
            Ingresa la clave de administración para <strong>{tenantName}</strong>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Clave de Acceso Master
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ingresar al Backoffice'}
          </button>
        </form>
      </div>
    </div>
  );
}
