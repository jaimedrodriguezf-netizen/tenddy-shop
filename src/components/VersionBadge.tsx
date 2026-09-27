'use client';

import React from 'react';
import { APP_VERSION } from '@/lib/version';

interface VersionBadgeProps {
  className?: string;
  showBranch?: boolean;
}

export default function VersionBadge({
  className = '',
}: VersionBadgeProps) {
  const cleanVersion = APP_VERSION.baseVersion ? `v${APP_VERSION.baseVersion}` : APP_VERSION.version;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border border-slate-800 bg-slate-900 text-slate-300 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span className="font-bold">{cleanVersion}</span>
    </span>
  );
}
