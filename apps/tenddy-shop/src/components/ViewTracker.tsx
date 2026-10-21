'use client';

import { useEffect, useRef } from 'react';

interface ViewTrackerProps {
  tenantId: string;
}

export default function ViewTracker({ tenantId }: ViewTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!tenantId || trackedRef.current) return;
    trackedRef.current = true;

    // Incrementar vista de forma asíncrona sin bloquear la carga de la página
    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId }),
    }).catch(() => {});
  }, [tenantId]);

  return null;
}
