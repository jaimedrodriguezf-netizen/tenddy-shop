import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { verifyTenantAdmin } from '@/lib/auth-guard';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tenantId = formData.get('tenant_id') as string | null;

    if (!file || !tenantId) {
      return NextResponse.json(
        { error: 'Archivo y tenant_id son requeridos' },
        { status: 400 }
      );
    }

    // Validar autorización de administrador
    const auth = await verifyTenantAdmin({ tenantId });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 });
    }

    // 1. Validar extensión permitida estrictamente para planillas de catálogo (Excel o CSV)
    const ALLOWED_IMPORT_EXTENSIONS = new Set(['csv', 'xlsx', 'xls']);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_IMPORT_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: 'Formato de archivo no permitido. Solo se aceptan archivos Excel (.xlsx, .xls) o CSV (.csv).' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Límite de 50MB para archivos de catálogo
    if (buffer.length > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 50MB' },
        { status: 400 }
      );
    }

    const MIME_MAP: Record<string, string> = {
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
    };
    const contentType = MIME_MAP[ext] || 'text/csv';

    const baseName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 50);

    const safeFileName = `${Date.now()}-${baseName || 'catalogo'}.${ext}`;
    const filePath = `imports/${tenantId}/${safeFileName}`;
    const admin = getAdminClient();

    const { error: uploadError } = await admin.storage
      .from('support-attachments')
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error subiendo archivo de importación a Storage:', uploadError);
      return NextResponse.json(
        { error: 'No se pudo almacenar el archivo de catálogo en Storage' },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = admin.storage
      .from('support-attachments')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      filePath,
      publicUrl: publicUrlData?.publicUrl || null,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (err: unknown) {
    console.error('Error procesando archivo de importación:', err);
    return NextResponse.json(
      { error: 'Error inesperado al procesar el archivo de importación' },
      { status: 500 }
    );
  }
}
