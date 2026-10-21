/**
 * Utilidad centralizada para traducir y humanizar errores técnicos para comerciantes de ecommerce.
 * Mantiene el error técnico original en la consola para depuración de los desarrolladores,
 * y devuelve un mensaje en español claro, cálido y sin tecnicismos para la interfaz gráfica.
 */

export function translateErrorMessage(
  err: unknown,
  fallbackMessage = 'Ocurrió un inconveniente al procesar la solicitud. Por favor intenta nuevamente.'
): string {
  // 1. Conservar el error técnico original en la consola para los ingenieros
  if (typeof window !== 'undefined') {
    console.error('[Error Técnico Original]:', err);
  }

  if (!err) return fallbackMessage;

  let rawMessage = '';
  if (typeof err === 'string') {
    rawMessage = err;
  } else if (err instanceof Error) {
    rawMessage = err.message || '';
  } else if (typeof err === 'object' && err !== null && 'error' in err) {
    const errorProp = (err as Record<string, unknown>).error;
    rawMessage = typeof errorProp === 'string' ? errorProp : JSON.stringify(errorProp);
  } else if (typeof err === 'object' && err !== null && 'message' in err) {
    const msgProp = (err as Record<string, unknown>).message;
    rawMessage = typeof msgProp === 'string' ? msgProp : JSON.stringify(msgProp);
  } else {
    rawMessage = String(err);
  }

  const clean = rawMessage.toLowerCase().trim();

  // 2. Si ya es un mensaje redactado en español por nuestras validaciones, retornarlo limpio
  const spanishIndicators = ['obligatorio', 'requerido', 'por favor', 'inicia sesión', 'debes ', 'ya existe', 'no se pudo', 'no permitido'];
  if (spanishIndicators.some((word) => clean.includes(word)) && !clean.includes('violates') && !clean.includes('postgres') && !clean.includes('syntax')) {
    return rawMessage;
  }

  // 3. Diccionario de Errores de Base de Datos y PostgreSQL / Supabase
  if (clean.includes('duplicate key') || clean.includes('unique constraint') || clean.includes('already exists')) {
    if (clean.includes('sku') || clean.includes('products_tenant_id_sku_key')) {
      return 'Ya tienes una prenda con este mismo Código/SKU en tu catálogo. Por favor cámbialo para poder guardarla.';
    }
    if (clean.includes('slug')) {
      return 'Ya existe un elemento con este identificador o nombre en tu tienda. Prueba con uno diferente.';
    }
    return 'Ya existe un registro con estos mismos datos en tu tienda. Por favor verifica la información.';
  }

  if (clean.includes('violates not-null') || clean.includes('null value in column')) {
    return 'Faltan campos obligatorios por completar. Revisa los datos requeridos antes de guardar.';
  }

  if (clean.includes('row-level security') || clean.includes('violates rls') || clean.includes('permission denied')) {
    return 'No tienes permisos para modificar este elemento o tu sesión ha caducado. Por favor recarga la página.';
  }

  if (clean.includes('foreign key constraint') || clean.includes('violates foreign key')) {
    return 'No se puede completar la operación porque este elemento está vinculado a otros productos o categorías de tu tienda.';
  }

  if (clean.includes('invalid input syntax for type uuid') || clean.includes('malformed')) {
    return 'El formato del identificador no es válido. Por favor actualiza la página y vuelve a intentar.';
  }

  // 4. Errores de Red y Conectividad
  if (
    clean.includes('failed to fetch') ||
    clean.includes('network request failed') ||
    clean.includes('networkerror') ||
    clean.includes('econnrefused') ||
    clean.includes('fetch failed')
  ) {
    return 'Problema de conexión con el servidor. Revisa tu conexión a internet o intenta nuevamente en unos segundos.';
  }

  if (clean.includes('timeout') || clean.includes('timed out') || clean.includes('gateway timeout')) {
    return 'La respuesta tardó más de lo esperado. Por favor verifica si tu conexión está estable e intenta de nuevo.';
  }

  // 5. Errores de Autenticación y Sesión
  if (
    clean.includes('jwt expired') ||
    clean.includes('token expired') ||
    clean.includes('invalid token') ||
    clean.includes('invalid claim')
  ) {
    return 'Tu sesión de Google ha expirado por seguridad. Por favor vuelve a identificarte para continuar.';
  }

  if (clean.includes('invalid login credentials') || clean.includes('user not found')) {
    return 'No pudimos verificar tu cuenta. Por favor inicia sesión nuevamente con Google.';
  }

  if (clean.includes('unauthorized') || clean.includes('no autorizado') || clean.includes('401')) {
    return 'Acceso no autorizado. Identifícate con tu cuenta de administrador de la tienda.';
  }

  // 6. Errores de Carga de Archivos e Imágenes
  if (
    clean.includes('payload too large') ||
    clean.includes('entity too large') ||
    clean.includes('request entity too large') ||
    clean.includes('413')
  ) {
    return 'El archivo o la foto es demasiado pesado. El tamaño máximo permitido es de 5 MB.';
  }

  if (clean.includes('unsupported media type') || clean.includes('mime type') || clean.includes('invalid file format')) {
    return 'Formato de archivo no soportado. Para fotos te recomendamos JPG o PNG, y para datos archivos de Excel (.xlsx).';
  }

  if (clean.includes('storage') && clean.includes('upload')) {
    return 'No se pudo guardar la imagen en el servidor de fotos. Prueba con otra imagen o comprímela antes de subir.';
  }

  // 7. Errores de Límite de Peticiones (Rate Limit)
  if (clean.includes('rate limit') || clean.includes('too many requests') || clean.includes('429')) {
    return 'Demasiadas solicitudes en poco tiempo. Por favor espera unos minutos antes de intentar de nuevo.';
  }

  // 8. Mensajes técnicos en inglés de Next.js / JavaScript
  if (clean.includes('unexpected token') || clean.includes('json at position') || clean.includes('syntaxerror')) {
    return 'El servidor entregó una respuesta inesperada. Por favor recarga la página.';
  }

  if (clean.includes('aborted') || clean.includes('aborterror')) {
    return 'La operación fue cancelada antes de completarse.';
  }

  // Fallback si el texto está en inglés
  if (/[a-z]/.test(clean) && !/[áéíóúñ]/.test(clean) && clean.length > 5) {
    return fallbackMessage;
  }

  return rawMessage || fallbackMessage;
}
