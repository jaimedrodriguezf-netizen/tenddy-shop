'use client';

import React, { useEffect, useRef } from 'react';

interface AymeOriginalLandingProps {
  htmlContent: string;
}

export default function AymeOriginalLanding({ htmlContent }: AymeOriginalLandingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    // Evitar que React StrictMode monte los scripts dos veces
    if (loadedRef.current) return;
    loadedRef.current = true;

    // Limpiar scripts anteriores si existieran
    const existingScripts = document.querySelectorAll('script[data-ayme-script="true"]');
    existingScripts.forEach((s) => s.remove());

    const scriptSources = [
      '/js/data.js',
      '/js/products.js',
      '/js/services.js',
      '/js/scroll-sequence.js',
      '/js/cart.js',
      '/js/app.js',
    ];

    let current = 0;

    function runNext() {
      if (current >= scriptSources.length) {
        // Redimensionar canvas explícitamente para pintar el primer frame
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          window.dispatchEvent(new Event('scroll'));
        }, 300);
        return;
      }

      const s = document.createElement('script');
      s.src = scriptSources[current];
      s.setAttribute('data-ayme-script', 'true');
      s.async = false;
      s.onload = () => {
        current++;
        runNext();
      };
      s.onerror = (e) => {
        console.error('Error cargando script:', scriptSources[current], e);
        current++;
        runNext();
      };
      document.body.appendChild(s);
    }

    runNext();
  }, []);

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
