'use client';

import { useEffect, useState } from 'react';
import styles from './ProductTunnelHero.module.css';

const products = [
  { file: 'ayme-bear-bottle-purple-cap.webp', alt: 'Envase oso translúcido con tapa morada' },
  { file: 'ayme-red-bear-bottle-spout.webp', alt: 'Envase oso rojo con pico dosificador' },
  { file: 'ayme-clear-bottle-red-dispenser.webp', alt: 'Botella transparente con dispensador rojo' },
  { file: 'ayme-clear-printed-cup.webp', alt: 'Vaso transparente con impresión' },
];

export default function ProductTunnelHero() {
  const [paused, setPaused] = useState(false);
  // Start static until the browser preference is known, including during hydration.
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setReducedMotion(preference.matches);
    syncPreference();
    preference.addEventListener('change', syncPreference);
    return () => preference.removeEventListener('change', syncPreference);
  }, []);

  const label = reducedMotion
    ? 'Animación desactivada por movimiento reducido'
    : paused ? 'Reanudar animación de productos' : 'Pausar animación de productos';

  return (
    <section
      className={styles.hero}
      data-product-hero
      data-paused={paused}
      data-reduced-motion={reducedMotion}
      aria-labelledby="product-hero-title"
    >
      <div className={styles.stage}>
        {products.map(product => (
          <img
            key={product.file}
            className={styles.product}
            src={`/assets/hero/prepared/${product.file}`}
            alt={product.alt}
            width={1200}
            height={1440}
            fetchPriority="high"
            draggable={false}
          />
        ))}
      </div>
      <div className={styles.copy}>
        <p className={styles.brand}>AYME INDUSTRIAS PET</p>
        <h1 id="product-hero-title">Dale forma a lo que imaginas.</h1>
        <p className={styles.lead}>Envases que acompañan las ideas de tu negocio.</p>
        <div className={styles.actions}>
          <a className={styles.primary} href="#catalog-section">Explorar catálogo <span aria-hidden="true">↗</span></a>
          <a className={styles.secondary} href="#contact-section">Solicitar cotización</a>
        </div>
      </div>
      <button
        type="button"
        className={styles.pause}
        aria-label={label}
        aria-pressed={paused || reducedMotion}
        disabled={reducedMotion}
        onClick={() => setPaused(value => !value)}
      >
        <span aria-hidden="true">{paused || reducedMotion ? '▷' : 'Ⅱ'}</span>
        {reducedMotion ? 'Sin movimiento' : paused ? 'Reanudar' : 'Pausar'}
      </button>
    </section>
  );
}
