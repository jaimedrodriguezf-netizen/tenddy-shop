/**
 * Módulo de Extracción de Paleta de Colores de Logotipos
 * Analiza una imagen mediante un Canvas offscreen, descartando transparencias y fondos
 * blancos/neutros, para cuantizar y extraer los colores corporativos primario y secundario.
 */

export interface ExtractedColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  palette: string[];
}

interface ColorBucket {
  r: number;
  g: number;
  b: number;
  count: number;
  hex: string;
  vibrancy: number;
}

/** Convierte componentes RGB a código HEX #rrggbb */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (c: number) => clamp(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Convierte código HEX a componentes RGB */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
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

/** Calcula distancia euclidiana entre dos colores RGB */
export function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
}

/**
 * Cuantiza y extrae los colores principales a partir de un arreglo plano RGBA de píxeles.
 * Adecuado para pruebas unitarias en Node o ejecución directa desde Canvas en el browser.
 */
export function extractPaletteFromPixels(
  pixels: Uint8ClampedArray | number[],
  step: number = 16
): ExtractedColorPalette {
  const buckets: { [key: string]: { r: number; g: number; b: number; count: number } } = {};

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    // 1. Descartar píxeles transparentes
    if (a < 128) continue;

    // 2. Descartar fondos blancos, casi blancos o grises neutros muy claros
    const isNearWhite = r > 235 && g > 235 && b > 235;
    const isVeryLightGray = r > 215 && g > 215 && b > 215 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15;
    if (isNearWhite || isVeryLightGray) continue;

    // 3. Descartar negros absolutos o sombras extremas si no tienen color
    const isExtremeBlack = r < 12 && g < 12 && b < 12;
    if (isExtremeBlack) continue;

    // Cuantizar coordenadas RGB en intervalos de 'step'
    const qr = Math.floor(r / step) * step + Math.floor(step / 2);
    const qg = Math.floor(g / step) * step + Math.floor(step / 2);
    const qb = Math.floor(b / step) * step + Math.floor(step / 2);
    const key = `${qr},${qg},${qb}`;

    if (!buckets[key]) {
      buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
    }
    buckets[key].r += r;
    buckets[key].g += g;
    buckets[key].b += b;
    buckets[key].count += 1;
  }

  const rawList: ColorBucket[] = Object.values(buckets).map((b) => {
    const avgR = Math.round(b.r / b.count);
    const avgG = Math.round(b.g / b.count);
    const avgB = Math.round(b.b / b.count);
    const maxVal = Math.max(avgR, avgG, avgB);
    const minVal = Math.min(avgR, avgG, avgB);
    const vibrancy = maxVal - minVal; // Saturación básica
    return {
      r: avgR,
      g: avgG,
      b: avgB,
      count: b.count,
      hex: rgbToHex(avgR, avgG, avgB),
      vibrancy,
    };
  });

  // Si no se encontró ningún color (por ejemplo logo monocromático puro o vacío), fallback
  if (rawList.length === 0) {
    return {
      primary: '#1F2E4D',
      secondary: '#A61C2E',
      accent: '#0284c7',
      palette: ['#1F2E4D', '#A61C2E', '#0284c7', '#334155'],
    };
  }

  // Ponderación de fuerza de marca: priorizar saturación y riqueza cromática
  // Los logos de marca se identifican por sus tonos cromáticos reales, no por sombras/antialiasing
  rawList.sort((a, b) => {
    const scoreA = a.count * Math.pow(a.vibrancy / 255 + 0.2, 1.8);
    const scoreB = b.count * Math.pow(b.vibrancy / 255 + 0.2, 1.8);
    return scoreB - scoreA;
  });

  // 1. Color Primario: el color de mayor peso e impacto de marca
  const primaryBucket = rawList[0];
  const primary = primaryBucket?.hex || '#1F2E4D';

  // 2. Color Secundario: buscar el color de mayor peso con contraste cromático real (distancia > 60)
  const secondaryCandidates = rawList.filter(
    (c) => colorDistance(c.r, c.g, c.b, primaryBucket.r, primaryBucket.g, primaryBucket.b) > 60
  );
  const secondaryBucket = secondaryCandidates[0] || rawList[1] || primaryBucket;
  const secondary = secondaryBucket.hex || '#A61C2E';

  // 3. Tercer color de apoyo / acento
  const accentCandidates = rawList.filter(
    (c) =>
      colorDistance(c.r, c.g, c.b, primaryBucket.r, primaryBucket.g, primaryBucket.b) > 35 &&
      colorDistance(c.r, c.g, c.b, secondaryBucket.r, secondaryBucket.g, secondaryBucket.b) > 35
  );
  const accent = accentCandidates[0]?.hex || '#0284c7';

  // Si tenemos un tono azulado y un tono rojizo corporativo, asegurar Azul Marino como Primario y Rojo Carmesí como Acento
  const isRed = (hex: string) => {
    const rgb = hexToRgb(hex);
    return rgb ? rgb.r > rgb.b + 30 && rgb.r > rgb.g + 20 : false;
  };
  const isBlue = (hex: string) => {
    const rgb = hexToRgb(hex);
    return rgb ? rgb.b > rgb.r + 15 : false;
  };

  let finalPrimary = primary;
  let finalSecondary = secondary;
  if (isRed(primary) && isBlue(secondary)) {
    finalPrimary = secondary;
    finalSecondary = primary;
  }

  // Armar paleta ordenada sin duplicados
  const distinctColors: string[] = [finalPrimary, finalSecondary];
  for (const c of rawList) {
    if (distinctColors.length >= 6) break;
    const isTooClose = distinctColors.some((existing) => {
      const rgb = hexToRgb(existing);
      return rgb ? colorDistance(c.r, c.g, c.b, rgb.r, rgb.g, rgb.b) < 35 : false;
    });
    if (!isTooClose) {
      distinctColors.push(c.hex);
    }
  }

  return {
    primary: finalPrimary,
    secondary: finalSecondary,
    accent,
    palette: distinctColors,
  };
}

/**
 * Carga una imagen (URL, Blob o File) en un canvas offscreen y extrae la paleta.
 * Funciona de forma no bloqueante en el navegador.
 */
export async function extractColorsFromImage(
  imageSource: string | File | Blob
): Promise<ExtractedColorPalette> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('extractColorsFromImage solo se ejecuta en entorno cliente/navegador'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrlToRevoke: string | null = null;

    if (typeof imageSource === 'string') {
      // Agregar cache-buster seguro para evitar que el navegador use una imagen cacheada sin cabeceras CORS
      const cleanUrl = imageSource.startsWith('http')
        ? (imageSource.includes('?') ? `${imageSource}&cors_bust=${Date.now()}` : `${imageSource}?cors_bust=${Date.now()}`)
        : imageSource;
      img.src = cleanUrl;
    } else {
      objectUrlToRevoke = URL.createObjectURL(imageSource);
      img.src = objectUrlToRevoke;
    }

    img.onload = () => {
      try {
        const maxDimension = 96;
        const scale = Math.min(1, maxDimension / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round((img.width || 1) * scale));
        const height = Math.max(1, Math.round((img.height || 1) * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('No se pudo inicializar contexto 2D de Canvas');
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        const result = extractPaletteFromPixels(imageData.data);
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        resolve(result);
      } catch (err) {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        reject(err);
      }
    };

    img.onerror = () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      reject(new Error('No se pudo cargar la imagen para analizar los colores corporativos'));
    };
  });
}
