'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, X, ShieldCheck } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-7 text-slate-900 shadow-2xl z-10 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Acceso a tu Panel</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-sky-600">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h4 className="text-base font-extrabold text-slate-900">Ingreso Rápido con Google</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Inicia sesión con tu cuenta de Google. Tu fábrica o tienda se detectará automáticamente para abrir tu panel de control.
          </p>
        </div>

        <div className="pt-1">
          <GoogleSignInButton
            redirectTo="/admin"
            label="Continuar con Google"
          />
        </div>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            ¿Aún no tienes una tienda en tenddy?{' '}
            <Link
              href="/registro"
              onClick={onClose}
              className="text-sky-600 font-semibold hover:underline"
            >
              Crea tu tienda B2B
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
