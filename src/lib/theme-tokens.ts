/**
 * Módulo de Tokens Cromáticos y Diseño Dinámico para el Storefront
 * Calcula luminancia, variantes accesibles y genera CSS Variables (--tenant-*)
 */

/**
 * Valida estrictamente si una cadena es un color HEX canónico (#rgb o #rrggbb)
 */
export function isValidHexColor(hex?: unknown): hex is string {
  if (typeof hex !== 'string') return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

/** Convierte componentes RGB a código HEX #rrggbb */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (c: number) => clamp(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Convierte código HEX a componentes RGB con validación estricta */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isValidHexColor(hex)) return null;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export interface StorefrontThemeTokens {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  primaryText: string;
  secondary: string;
  secondaryHover: string;
  secondaryLight: string;
  secondaryBorder: string;
  secondaryText: string;
}

/**
 * Calcula si un color HEX es claro u oscuro para elegir texto blanco o carbón
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  // Fórmula estándar de luminancia perceptual ITU-R BT.601
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6;
}

/**
 * Ajusta el brillo de un color HEX en un porcentaje (-100 a 100)
 */
export function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const factor = 1 + percent / 100;
  return rgbToHex(
    Math.min(255, Math.max(0, Math.round(rgb.r * factor))),
    Math.min(255, Math.max(0, Math.round(rgb.g * factor))),
    Math.min(255, Math.max(0, Math.round(rgb.b * factor)))
  );
}

/**
 * Resuelve y genera el conjunto completo de tokens cromáticos para el Storefront
 */
export function resolveStorefrontTokens(
  primaryInput?: string | null,
  secondaryInput?: string | null
): StorefrontThemeTokens {
  // Blindaje Defense-in-Depth: solo colores HEX válidos son admitidos; fallback automático
  const primary = isValidHexColor(primaryInput) ? primaryInput.trim() : '#FB7701';
  const secondary = isValidHexColor(secondaryInput) ? secondaryInput.trim() : '#111827';

  const pRgb = hexToRgb(primary) || { r: 251, g: 119, b: 1 };
  const sRgb = hexToRgb(secondary) || { r: 17, g: 24, b: 39 };

  return {
    primary,
    primaryHover: adjustBrightness(primary, -12),
    primaryLight: `rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, 0.10)`,
    primaryBorder: `rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, 0.28)`,
    primaryText: isLightColor(primary) ? '#0f172a' : '#ffffff',

    secondary,
    secondaryHover: adjustBrightness(secondary, -12),
    secondaryLight: `rgba(${sRgb.r}, ${sRgb.g}, ${sRgb.b}, 0.10)`,
    secondaryBorder: `rgba(${sRgb.r}, ${sRgb.g}, ${sRgb.b}, 0.28)`,
    secondaryText: isLightColor(secondary) ? '#0f172a' : '#ffffff',
  };
}

/**
 * Construye el objeto de variables CSS para inyectar en el contenedor raíz
 */
export function buildStorefrontThemeCSS(
  primaryInput?: string | null,
  secondaryInput?: string | null
): React.CSSProperties {
  const tokens = resolveStorefrontTokens(primaryInput, secondaryInput);

  return {
    '--tenant-primary': tokens.primary,
    '--tenant-primary-hover': tokens.primaryHover,
    '--tenant-primary-light': tokens.primaryLight,
    '--tenant-primary-border': tokens.primaryBorder,
    '--tenant-primary-text': tokens.primaryText,

    '--tenant-secondary': tokens.secondary,
    '--tenant-secondary-hover': tokens.secondaryHover,
    '--tenant-secondary-light': tokens.secondaryLight,
    '--tenant-secondary-border': tokens.secondaryBorder,
    '--tenant-secondary-text': tokens.secondaryText,
  } as React.CSSProperties;
}
