/**
 * Compresor de imágenes en el cliente (Browser Native Canvas API)
 * Reduce fotos de smartphones (5MB-15MB) a ~150KB-300KB de alta calidad WebP/JPEG en milisegundos.
 */
export async function compressImage(
  file: File | Blob,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputFormat?: 'image/webp' | 'image/jpeg';
  } = {}
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    outputFormat = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular escalado proporcional si excede límites máximos
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback si canvas falla
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Suavizado bicúbico de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a WebP (o JPEG si WebP no es soportado)
        let dataUrl = canvas.toDataURL(outputFormat, quality);
        if (!dataUrl.startsWith(`data:${outputFormat}`)) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };

      img.onerror = () => {
        // Fallback a la imagen original si falla el decode
        resolve(readerEvent.target?.result as string);
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
