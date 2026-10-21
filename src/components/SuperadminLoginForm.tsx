'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';

interface SuperadminLoginFormProps {
  onSuccess: () => void;
}

export default function SuperadminLoginForm({ onSuccess }: SuperadminLoginFormProps) {
  const [authMode, setAuthMode] = useState<'credentials' | 'secretKey'>('credentials');
  const [email, setEmail] = useState('jaimedrodriguezf@gmail.com');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload =
        authMode === 'credentials'
          ? { email: email.trim(), password }
          : { secretKey: secretKey.trim() };

      const res = await fetch('/api/superadmin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión como Superadmin');
      }

      onSuccess();
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-slate-100 space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 font-bold shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Torre de Control Superadmin</h2>
          <p className="text-xs text-slate-400">
            Acceso exclusivo para el propietario de la plataforma <strong>tenddy</strong>
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. BOTÓN PRINCIPAL CON GOOGLE */}
        <div className="space-y-3">
          <GoogleSignInButton
            redirectTo="/superadmin"
            label="Continuar con Google (jaimedrodriguezf@gmail.com)"
            className="w-full justify-center shadow-md bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs py-3 rounded-xl border border-slate-300"
          />

          <div className="flex items-center gap-3 text-slate-600 text-[11px] my-3">
            <div className="h-px bg-slate-800 flex-1" />
            <span>O con credenciales de cuenta</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>
        </div>

        {/* 2. SELECTOR DE MODO DE ACCESO */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setAuthMode('credentials')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              authMode === 'credentials'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Email y Contraseña
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('secretKey')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              authMode === 'secretKey'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Clave Maestra
          </button>
        </div>

        {/* 3. FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'credentials' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Correo Electrónico de Superadmin
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jaimedrodriguezf@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Clave Maestra de Plataforma (Emergencia)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none transition-all font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Fallback de infraestructura: tenddy_master_2026
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Acceder a la Torre de Control</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
