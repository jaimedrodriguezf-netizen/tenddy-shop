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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Límite de 50MB para archivos de catálogo
    if (buffer.length > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 50MB' },
        { status: 400 }
      );
    }

    const cleanFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_')
      .slice(0, 80);

    const filePath = `imports/${tenantId}/${Date.now()}-${cleanFileName}`;
    const admin = getAdminClient();

    const { error: uploadError } = await admin.storage
      .from('support-attachments')
      .upload(filePath, buffer, {
        contentType: file.type || 'text/csv',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error subiendo archivo de importación a Storage:', uploadError);
      return NextResponse.json(
        { error: `Error en Storage: ${uploadError.message}` },
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
      { error: err instanceof Error ? err.message : 'Error inesperado al subir archivo' },
      { status: 500 }
    );
  }
}
