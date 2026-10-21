/**
 * Utilidades centralizadas para resolución de imágenes de productos
 */

export function hasValidProductImage(
  images?: string[] | null,
  tenant?: { slug?: string; industry_type?: string } | null
): boolean {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return false;
  }
  const primary = images[0];
  if (typeof primary !== 'string' || !primary.trim()) {
    return false;
  }
  if (primary.includes('ayme-001.svg') && tenant?.slug !== 'ayme-pet' && tenant?.industry_type !== 'plastics') {
    return false;
  }
  return true;
}

export function getProductPrimaryImage(
  images?: string[] | null,
  tenant?: { slug?: string; industry_type?: string } | null,
  fallback = '/assets/placeholder-product.svg'
): string {
  if (hasValidProductImage(images, tenant)) {
    return (images![0] as string).trim();
  }
  return fallback;
}
