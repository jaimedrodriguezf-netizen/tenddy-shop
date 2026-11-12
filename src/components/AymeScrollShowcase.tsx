'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import styles from './AymeScrollShowcase.module.css';

interface Props {
  products: Product[];
  onAdd: (product: Product) => void;
  onNavigate: () => void;
}

// Solo estas dos fotografías tienen una correspondencia de catálogo confirmada.
const scenes = [
  { image: 'ayme-bear-bottle-purple-cap.webp', sku: 'AYME-030', title: 'Envase osito con tapa morada', facts: 'Forma de osito · Cuerpo translúcido · Tapa morada' },
  { image: 'ayme-red-bear-bottle-spout.webp', title: 'Envase osito rojo', facts: 'Forma de osito · Color rojo · Pico dosificador' },
  { image: 'ayme-clear-bottle-red-dispenser.webp', title: 'Botella con dispensador rojo', facts: 'Cuerpo transparente · Caras planas · Cierre rojo' },
  { image: 'ayme-clear-printed-cup.webp', sku: 'AYME-042', title: 'Vaso transparente estampado', facts: 'Cuerpo transparente · Diseño estampado' },
];

export default function AymeScrollShowcase({ products, onAdd, onNavigate }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // SSR y navegación sin JavaScript conservan las cuatro escenas en flujo.
  const [pinned, setPinned] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame: number | null = null;
    let canPin = false;
    let top = 0;
    let distance = 1;
    let measure = true;

    const update = () => {
      frame = null;
      if (measure) {
        measure = false;
        const mobile = window.innerWidth < 768;
        const copies = Array.from(stage.querySelectorAll<HTMLElement>('[data-showcase-copy]'));
        const copyHeight = Math.max(...copies.map(copy => copy.scrollHeight), 0);
        const imageHeight = mobile ? Math.min(window.innerHeight * 0.28, 240) : window.innerHeight * 0.58;
        const required = mobile ? copyHeight + imageHeight + 24 : Math.max(copyHeight, imageHeight);
        canPin = !reduced.matches && window.innerHeight >= 740 && required < window.innerHeight - 160;
        setPinned(canPin);
        top = section.getBoundingClientRect().top + window.scrollY;
        // La pista CSS mide 380vh; no dependemos de la actualización React pendiente.
        distance = Math.max(1, window.innerHeight * 2.8);
      }
      if (!canPin) return;
      const progress = Math.max(0, Math.min(0.999999, (window.scrollY - top) / distance));
      const position = progress * scenes.length;
      const index = Math.floor(position);
      const local = position - index;
      // Entrada / lectura sostenida / salida: sin reloj ni rotación de la fotografía.
      const entrance = Math.min(1, local / 0.28);
      const exit = Math.max(0, (local - 0.76) / 0.24);
      stage.style.setProperty('--scene-scale', String(0.9 + entrance * 0.1 - exit * 0.04));
      stage.style.setProperty('--scene-y', `${(1 - entrance) * 32 - exit * 24}px`);
      stage.style.setProperty('--scene-opacity', String(0.65 + entrance * 0.35 - exit * 0.35));
      setActive(previous => previous === index ? previous : index);
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    const resize = () => { measure = true; schedule(); };
    const observer = new ResizeObserver(resize);
    stage.querySelectorAll('[data-showcase-copy]').forEach(copy => observer.observe(copy));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    reduced.addEventListener('change', resize);
    // La carga de fuentes puede cambiar las alturas sin un resize de ventana.
    schedule();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', resize);
      reduced.removeEventListener('change', resize);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.showcase} data-ayme-showcase="" data-pinned={pinned} aria-label="Envases en detalle">
      <div ref={stageRef} className={styles.stage}>
        {scenes.map((scene, index) => {
          const product = scene.sku ? products.find(item => item.sku === scene.sku) : undefined;
          const title = product?.name || scene.title;
          const hidden = pinned && active !== index;
          const href = product ? `/store/ayme-pet/producto/${encodeURIComponent(product.slug || product.sku?.toLowerCase() || product.id)}` : undefined;
          return (
            <article key={scene.image} className={styles.scene} data-showcase-scene={index} aria-hidden={hidden} inert={hidden}>
              <div className={styles.copy} data-showcase-copy="">
                <p className={styles.eyebrow}>Envases en detalle <span>{index + 1} / 4</span></p>
                <h3>{title}</h3>
                <p className={styles.facts}>{scene.facts}</p>
                <div className={styles.actions}>
                  {product && href ? <>
                    <Link href={href} onClick={onNavigate}>Ver ficha</Link>
                    <button type="button" onClick={() => onAdd(product)}>Agregar al pedido</button>
                  </> : <a href="#contact-section">Consultar este modelo</a>}
                </div>
                <p className={styles.hint}>Desliza para descubrir · O continúa al <a href="#catalog-section">catálogo</a></p>
              </div>
              <div className={styles.visual}>
                <img src={`/assets/hero/prepared/${scene.image}`} alt={title} width={1200} height={1200} loading="lazy" decoding="async" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
