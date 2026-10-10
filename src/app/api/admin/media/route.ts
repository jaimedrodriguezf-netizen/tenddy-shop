import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';

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

// 1. GET: Listar todos los medios del tenant (Almacenamiento de Supabase + Medios de productos)
export async function GET(request: Request) {
  try {
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

    // A. Listar archivos físicos en Supabase Storage (carpetas: products, imports, logos)
    const storageFolders = ['products', 'imports', 'logos'];

    for (const folder of storageFolders) {
      try {
        const { data: files } = await admin.storage
          .from('support-attachments')
          .list(`${folder}/${tenantId}`, {
            limit: 200,
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (files && files.length > 0) {
          for (const file of files) {
            // Ignorar directorios virtuales vacíos
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
              } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.webp') || lowerName.endsWith('.gif') || lowerName.endsWith('.svg')) {
                type = 'image';
              } else if (lowerName.endsWith('.pdf') || lowerName.endsWith('.txt') || lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
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
      } catch (fErr) {
        console.warn(`Error listando carpeta ${folder}:`, fErr);
      }
    }

    // B. Obtener imágenes de productos de la base de datos para asegurar catálogo completo
    const { data: products } = await admin
      .from('products')
      .select('id, name, sku, images, created_at')
      .eq('tenant_id', tenantId)
      .limit(300);

    if (products && products.length > 0) {
      for (const prod of products) {
        if (Array.isArray(prod.images)) {
          for (const imgUrl of prod.images) {
            if (typeof imgUrl === 'string' && imgUrl.startsWith('http') && !seenUrls.has(imgUrl)) {
              seenUrls.add(imgUrl);

              // Extraer nombre amigable de la URL
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
      { error: err instanceof Error ? err.message : 'Error inesperado al cargar medios' },
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
