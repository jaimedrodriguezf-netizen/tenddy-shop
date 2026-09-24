'use client';

import React from 'react';
import { APP_VERSION } from '@/lib/version';
import { GitBranch, Tag } from 'lucide-react';

interface VersionBadgeProps {
  className?: string;
  showBranch?: boolean;
}

export default function VersionBadge({
  className = '',
  showBranch = true,
}: VersionBadgeProps) {
  const isProd = APP_VERSION.environment === 'production';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border transition-colors ${
        isProd
          ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200'
          : 'bg-amber-50/80 text-amber-800 border-amber-200'
      } ${className}`}
      title={`Compilado: ${new Date(APP_VERSION.builtAt).toLocaleString()}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isProd ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
        }`}
      />
      <span className="font-bold">{APP_VERSION.version}</span>
      {showBranch && (
        <span className="text-slate-400">
          ({APP_VERSION.branch})
        </span>
      )}
    </div>
  );
}
