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
  step: number = 24
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
    const isVeryLightGray = r > 220 && g > 220 && b > 220 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15;
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

  // Ordenar primero por frecuencia combinada con vibrancia
  rawList.sort((a, b) => {
    // Puntuación balanceada: frecuencia ponderada y riqueza cromática
    const scoreA = a.count * (1 + (a.vibrancy / 255) * 1.5);
    const scoreB = b.count * (1 + (b.vibrancy / 255) * 1.5);
    return scoreB - scoreA;
  });

  // Filtrar colores duplicados o demasiado similares (distancia mínima de 40)
  const distinctColors: ColorBucket[] = [];
  for (const candidate of rawList) {
    const isTooClose = distinctColors.some(
      (picked) =>
        colorDistance(
          candidate.r,
          candidate.g,
          candidate.b,
          picked.r,
          picked.g,
          picked.b
        ) < 42
    );
    if (!isTooClose) {
      distinctColors.push(candidate);
    }
    if (distinctColors.length >= 6) break;
  }

  const primary = distinctColors[0]?.hex || '#1F2E4D';

  // Buscar un color secundario que tenga suficiente contraste/distancia cromática con el primario
  let secondary = distinctColors[1]?.hex;
  if (!secondary) {
    // Si solo hay un color principal, derivar un acento armónico complementario
    const p = distinctColors[0];
    secondary = p.vibrancy > 50 ? rgbToHex(255 - p.r, 255 - p.g, p.b) : '#A61C2E';
  }

  // Buscar tercer color como acento
  const accent = distinctColors[2]?.hex || distinctColors[1]?.hex || '#0284c7';

  const palette = distinctColors.map((c) => c.hex);
  if (!palette.includes(primary)) palette.unshift(primary);
  if (!palette.includes(secondary)) palette.push(secondary);

  return {
    primary,
    secondary,
    accent,
    palette,
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
      img.src = imageSource;
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
