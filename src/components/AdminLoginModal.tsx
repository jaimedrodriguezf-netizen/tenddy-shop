'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, X, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const router = useRouter();
  const [shopSlug, setShopSlug] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopSlug.trim()) {
      setErrorMsg('Ingresa el identificador de tu tienda');
      return;
    }

    const clean = shopSlug
      .toLowerCase()
      .trim()
      .replace('.tenddy.shop', '')
      .replace('.localhost', '')
      .replace(/[^a-z0-9-]/g, '');

    router.push(`/store/${clean}/admin`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-7 text-slate-900 shadow-2xl z-10 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Ingreso a Panel de Tienda</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Identificador o Subdominio de tu Empresa
            </label>
            <div className="flex items-center">
              <input
                type="text"
                required
                autoFocus
                value={shopSlug}
                onChange={(e) => setShopSlug(e.target.value)}
                placeholder="ej: ayme-pet o dulcelandia"
                className="w-full bg-slate-50 border border-slate-200 rounded-l-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
              />
              <span className="bg-slate-100 border border-l-0 border-slate-200 text-slate-500 text-[11px] px-3 py-2.5 rounded-r-xl font-mono">
                .tenddy.shop
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ejemplos activos: <strong className="text-slate-600 cursor-pointer" onClick={() => setShopSlug('ayme-pet')}>ayme-pet</strong> o <strong className="text-slate-600 cursor-pointer" onClick={() => setShopSlug('dulcelandia')}>dulcelandia</strong>
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>Ir a Mi Panel de Control</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
