import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'spreadsheet' | 'document' | 'other';
  mimeType: string;
  size?: number;
  created_at: string;
  folder: string;
  attachedTo?: string;
  storagePath?: string;
}

// Validación de Magic Bytes binarios para prevenir MIME-spoofing y ejecución de scripts camuflados
function isValidImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  // JPEG / JPG: FF D8 FF
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A
    );
  }

  // WebP: RIFF en 0..3 y WEBP en 8..11
  if (mimeType === 'image/webp') {
    const isRiff =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  // GIF: GIF87a o GIF89a
  if (mimeType === 'image/gif') {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38 &&
      (buffer[4] === 0x37 || buffer[4] === 0x39) &&
      buffer[5] === 0x61
    );
  }

  return true;
}

// 1. GET: Listar todos los medios del tenant de forma paralela y optimizada (Storage + Productos)
export async function GET(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate limiting: máximo 60 consultas de catálogo de medios por minuto
    const { isAllowed } = checkRateLimit(`media_get_${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 60,
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera un momento.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id es requerido' }, { status: 400 });
    }

    const auth = await verifyTenantAdmin({ tenantId });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const admin = getAdminClient();
    const mediaList: MediaAsset[] = [];
    const seenUrls = new Set<string>();

    const storageFolders = ['products', 'imports', 'logos'];

    // Optimización de rendimiento: Consultar carpetas de Storage y catálogo de productos concurrentemente en paralelo
    const [storageResults, productsRes] = await Promise.all([
      Promise.all(
        storageFolders.map(async (folder) => {
          try {
            const { data: files } = await admin.storage
              .from('support-attachments')
              .list(`${folder}/${tenantId}`, {
                limit: 300,
                sortBy: { column: 'created_at', order: 'desc' },
              });
            return { folder, files: files || [] };
          } catch (fErr) {
            console.warn(`Error listando carpeta ${folder}:`, fErr);
            return { folder, files: [] };
          }
        })
      ),
      admin
        .from('products')
        .select('id, name, sku, images, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(500),
    ]);

    // A. Procesar archivos físicos en Supabase Storage
    for (const { folder, files } of storageResults) {
      for (const file of files) {
        if (!file.name || file.name === '.emptyFolderPlaceholder') continue;

        const filePath = `${folder}/${tenantId}/${file.name}`;
        const { data: pubData } = admin.storage
          .from('support-attachments')
          .getPublicUrl(filePath);

        const fileUrl = pubData?.publicUrl || '';
        if (fileUrl && !seenUrls.has(fileUrl)) {
          seenUrls.add(fileUrl);

          const lowerName = file.name.toLowerCase();
          let type: MediaAsset['type'] = 'other';
          if (lowerName.endsWith('.csv') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
            type = 'spreadsheet';
          } else if (
            lowerName.endsWith('.jpg') ||
            lowerName.endsWith('.jpeg') ||
            lowerName.endsWith('.png') ||
            lowerName.endsWith('.webp') ||
            lowerName.endsWith('.gif') ||
            lowerName.endsWith('.svg')
          ) {
            type = 'image';
          } else if (
            lowerName.endsWith('.pdf') ||
            lowerName.endsWith('.txt') ||
            lowerName.endsWith('.doc') ||
            lowerName.endsWith('.docx')
          ) {
            type = 'document';
          }

          mediaList.push({
            id: file.id || `storage-${filePath}`,
            name: file.name,
            url: fileUrl,
            type,
            mimeType: (file.metadata as any)?.mimetype || (type === 'image' ? 'image/jpeg' : 'application/octet-stream'),
            size: (file.metadata as any)?.size || (file.metadata as any)?.contentLength || undefined,
            created_at: file.created_at || new Date().toISOString(),
            folder,
            storagePath: filePath,
          });
        }
      }
    }

    // B. Procesar imágenes de productos de la base de datos
    const products = productsRes.data;
    if (products && products.length > 0) {
      for (const prod of products) {
        if (Array.isArray(prod.images)) {
          for (const imgUrl of prod.images) {
            if (typeof imgUrl === 'string' && imgUrl.startsWith('http') && !seenUrls.has(imgUrl)) {
              seenUrls.add(imgUrl);

              const urlParts = imgUrl.split('/');
              const lastPart = urlParts[urlParts.length - 1] || 'imagen.jpg';
              const cleanName = lastPart.split('?')[0] || `foto-${prod.sku || 'prod'}.jpg`;

              mediaList.push({
                id: `prod-img-${prod.id}-${encodeURIComponent(cleanName)}`,
                name: decodeURIComponent(cleanName),
                url: imgUrl,
                type: 'image',
                mimeType: 'image/jpeg',
                created_at: prod.created_at || new Date().toISOString(),
                folder: 'products',
                attachedTo: prod.name || prod.sku,
              });
            }
          }
        }
      }
    }

    // Ordenar de más reciente a más antiguo
    mediaList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      success: true,
      media: mediaList,
      total: mediaList.length,
    });
  } catch (err: unknown) {
    console.error('Error listando biblioteca de medios:', err);
    return NextResponse.json(
      { error: 'Error inesperado al cargar medios' },
      { status: 500 }
    );
  }
}

// Whitelist de tipos MIME y extensiones autorizadas (neutraliza Stored XSS y ejecución remota)
const ALLOWED_MEDIA_TYPES: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'text/csv': 'csv',
  'text/plain': 'txt',
};

const ALLOWED_FOLDERS = new Set(['products', 'imports', 'logos']);

// 2. POST: Subir nuevos medios directamente a Supabase Storage
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tenantId = formData.get('tenant_id') as string | null;
    const requestedFolder = String(formData.get('folder') || 'products').trim().toLowerCase();
    const folder = ALLOWED_FOLDERS.has(requestedFolder) ? requestedFolder : 'products';

    if (!file || !tenantId) {
      return NextResponse.json({ error: 'Archivo y tenant_id requeridos' }, { status: 400 });
    }

    const auth = await verifyTenantAdmin({ tenantId });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    const clientIp = getClientIp(request);
    // Rate limiting defensivo contra saturación de almacenamiento (máximo 30 subidas por minuto por tienda/IP)
    const { isAllowed } = checkRateLimit(`media_post_${tenantId}_${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 30,
    });
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Has alcanzado el límite de subidas por minuto. Por favor espera un momento.' },
        { status: 429 }
      );
    }

    // 1. Validar tipo MIME y extensión contra whitelist estricta (Previene Stored XSS y MIME-spoofing)
    const rawMimeType = (file.type || '').toLowerCase().trim();
    const mappedExt = ALLOWED_MEDIA_TYPES[rawMimeType];
    const rawExt = file.name.split('.').pop()?.toLowerCase() || '';

    const FORBIDDEN_EXTENSIONS = new Set([
      'html', 'htm', 'svg', 'xhtml', 'xml', 'js', 'mjs',
      'php', 'sh', 'bash', 'exe', 'bat', 'cmd', 'ps1', 'cgi', 'pl',
    ]);

    if (FORBIDDEN_EXTENSIONS.has(rawExt)) {
      return NextResponse.json(
        { error: 'Extensión de archivo no permitida por políticas de seguridad.' },
        { status: 400 }
      );
    }

    if (!mappedExt) {
      return NextResponse.json(
        {
          error:
            'Tipo de archivo no permitido. Solo se admiten imágenes (WebP, JPG, PNG, GIF), documentos PDF y hojas de cálculo (Excel, CSV).',
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Límites de tamaño según categoría
    const isImage = rawMimeType.startsWith('image/');
    const maxBytes = isImage ? 15 * 1024 * 1024 : 35 * 1024 * 1024; // 15MB fotos, 35MB hojas de cálculo
    if (buffer.length > maxBytes) {
      const limitMb = isImage ? '15MB' : '35MB';
      return NextResponse.json(
        { error: `El archivo excede el tamaño máximo permitido de ${limitMb}` },
        { status: 400 }
      );
    }

    // 2.1 Validación binaria de Magic Bytes para neutralizar MIME-spoofing
    if (isImage && !isValidImageMagicBytes(buffer, rawMimeType)) {
      return NextResponse.json(
        { error: 'La firma binaria del archivo no corresponde a una imagen válida.' },
        { status: 400 }
      );
    }

    // 3. Sanitización estricta del nombre y extensión forzada
    const baseName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 50);
    const safeFileName = `${Date.now()}-${baseName || 'archivo'}.${mappedExt}`;
    const filePath = `${folder}/${tenantId}/${safeFileName}`;
    const admin = getAdminClient();

    const { error: uploadErr } = await admin.storage
      .from('support-attachments')
      .upload(filePath, buffer, {
        contentType: rawMimeType,
        upsert: true,
      });

    if (uploadErr) {
      console.error('Error subiendo medio a Storage:', uploadErr);
      return NextResponse.json({ error: 'No se pudo almacenar el archivo en Storage' }, { status: 500 });
    }

    const { data: pubData } = admin.storage
      .from('support-attachments')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: pubData?.publicUrl,
      name: file.name,
      size: file.size,
      filePath,
    });
  } catch (err: unknown) {
    console.error('Error en carga de medio:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al subir archivo' },
      { status: 500 }
    );
  }
}

// 3. DELETE: Eliminar medios de Supabase Storage
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, filePaths } = body;

    if (!tenant_id || !Array.isArray(filePaths) || filePaths.length === 0) {
      return NextResponse.json({ error: 'tenant_id y filePaths son requeridos' }, { status: 400 });
    }

    const auth = await verifyTenantAdmin({ tenantId: tenant_id });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    // Seguridad: asegurarse de que cada ruta comience estrictamente en la carpeta autorizada del tenant
    const allowedPrefixes = ['products/', 'imports/', 'logos/'].map((f) => `${f}${tenant_id}/`);
    const safePaths = filePaths.filter(
      (path: string) =>
        typeof path === 'string' &&
        allowedPrefixes.some((pref) => path.startsWith(pref)) &&
        !path.includes('..') &&
        !path.includes('\0')
    );

    if (safePaths.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No hay archivos válidos para eliminar' });
    }

    const admin = getAdminClient();
    const { error: delError } = await admin.storage
      .from('support-attachments')
      .remove(safePaths);

    if (delError) {
      console.error('Error eliminando archivos de Storage:', delError);
      return NextResponse.json({ error: 'No se pudieron eliminar los archivos de Storage' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedCount: safePaths.length,
      message: `Se eliminaron ${safePaths.length} archivos con éxito.`,
    });
  } catch (err: unknown) {
    console.error('Error eliminando medios:', err);
    return NextResponse.json(
      { error: 'Error del servidor al eliminar medios' },
      { status: 500 }
    );
  }
}
