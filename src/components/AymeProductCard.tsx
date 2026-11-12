import Link from 'next/link';
import { Eye, MessageCircle, Plus, Video } from 'lucide-react';
import { Product } from '@/lib/types';
import styles from './AymeProductCard.module.css';

interface Props {
  product: Product;
  href: string;
  category?: string;
  packagingUnit: string;
  onNavigate: () => void;
  onAdd: () => void;
  onQuote: () => void;
}

// This component inherits the landing's client boundary and existing callbacks.
export default function AymeProductCard({ product, href, category, packagingUnit, onNavigate, onAdd, onQuote }: Props) {
  const specs = Object.entries(product.attributes?.specs || {}).filter(([, value]) => {
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    return !['', 'estándar', 'estandar', 'n/a', 'na', '-', 'no aplica', 'sin datos', 'null', 'undefined'].includes(String(value).trim().toLowerCase());
  });
  return (
    <article className={styles.card} data-ayme-card={product.id}>
      <Link href={href} onClick={onNavigate} className={styles.imageLink} title={`Ver ficha técnica de ${product.name}`}>
        <img src={product.images?.[0] || '/assets/placeholder-product.svg'} alt={product.name} loading="lazy" decoding="async"
          onError={e => { e.currentTarget.onerror = null; if (!e.currentTarget.src.endsWith('/assets/placeholder-product.svg')) e.currentTarget.src = '/assets/placeholder-product.svg'; }} />
        {product.attributes?.badge && <span className={styles.badge}>{product.attributes.badge}</span>}
        {product.attributes?.video_url && <span className={styles.video}><Video size={13} aria-hidden="true" />Video 360°</span>}
      </Link>
      <div className={styles.content}>
        {category && <p className={styles.category}>{category}</p>}
        <h3><Link href={href} onClick={onNavigate}>{product.name}</Link></h3>
        <p className={`font-mono ${styles.sku}`} data-card-sku>SKU: {product.sku}</p>
        {specs.length > 0 && <dl className={styles.specs}>{specs.map(([key, value]) => <div key={key}><dt>{key.replace(/_/g, ' ')}</dt><dd>{String(value)}</dd></div>)}</dl>}
        <div className={styles.bottom}>
          <p className={styles.packaging}>Empaque <strong>{product.units_per_package || 1} u/{packagingUnit.toLowerCase()}</strong></p>
          <div data-card-actions>
            <button type="button" className={styles.primary} title="Agregar al pedido" aria-label={`Agregar al pedido: ${product.name}`} onClick={onAdd}><Plus size={17} aria-hidden="true" /><span>Agregar al pedido</span></button>
            <div className={styles.secondary}>
              <Link href={href} onClick={onNavigate} title="Ver Ficha Técnica en página separada" aria-label={`Ficha: ${product.name}`}><Eye size={16} aria-hidden="true" /><span>Ficha</span></Link>
              <button type="button" title="Cotizar por WhatsApp" aria-label={`Cotizar por WhatsApp: ${product.name}`} onClick={onQuote}><MessageCircle size={16} aria-hidden="true" /><span>Cotizar</span></button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
