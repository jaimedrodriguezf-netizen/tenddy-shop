/**
 * Módulo de Normalización Telefónica de Ecuador 🇪🇨
 * Valida y transforma números celulares y fijos al estándar internacional para WhatsApp (+593).
 *
 * Reglas de telefonía en Ecuador:
 * - Celulares: 10 dígitos iniciando en 09 (ej: 0998722324) -> WhatsApp wa.me/593998722324
 * - Fijos: 9 dígitos iniciando en 02..07 (ej: 022803464) -> WhatsApp wa.me/59322803464
 */

export interface EcuadorPhoneResult {
  international: string;  // Para URLs wa.me/ (ej: 593998722324)
  display: string;        // Para lectura local (ej: 0998722324)
  formatted: string;      // Con espaciado visual (ej: +593 99 872 2324 o 099 872 2324)
  isValid: boolean;
  isCellPhone: boolean;
  error?: string;
}

/**
 * Normaliza cualquier entrada telefónica al estándar oficial de Ecuador
 */
export function normalizeEcuadorPhone(input: unknown): EcuadorPhoneResult {
  if (typeof input !== 'string' || !input.trim()) {
    return {
      international: '',
      display: '',
      formatted: '',
      isValid: false,
      isCellPhone: false,
      error: 'Número de teléfono vacío',
    };
  }

  // Eliminar caracteres no numéricos
  const digits = input.trim().replace(/\D/g, '');

  // 1. Celular estándar con 0 inicial (10 dígitos: 09xxxxxxxx)
  if (digits.length === 10 && digits.startsWith('09')) {
    const international = `593${digits.substring(1)}`;
    const display = digits;
    const formatted = `+593 ${digits.substring(1, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
    return {
      international,
      display,
      formatted,
      isValid: true,
      isCellPhone: true,
    };
  }

  // 2. Celular ya con código de país 593 (12 dígitos: 5939xxxxxxxx)
  if (digits.length === 12 && digits.startsWith('5939')) {
    const international = digits;
    const display = `0${digits.substring(3)}`;
    const formatted = `+593 ${digits.substring(3, 5)} ${digits.substring(5, 8)} ${digits.substring(8)}`;
    return {
      international,
      display,
      formatted,
      isValid: true,
      isCellPhone: true,
    };
  }

  // 3. Celular ingresado sin 0 inicial y sin 593 (9 dígitos: 9xxxxxxxx)
  if (digits.length === 9 && digits.startsWith('9')) {
    const international = `593${digits}`;
    const display = `0${digits}`;
    const formatted = `+593 ${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
    return {
      international,
      display,
      formatted,
      isValid: true,
      isCellPhone: true,
    };
  }

  // 4. Teléfono fijo con código de provincia (9 dígitos: 02..07xxxxxxx)
  if (digits.length === 9 && /^0[2-7]/.test(digits)) {
    const international = `593${digits.substring(1)}`;
    const display = digits;
    const formatted = `+593 ${digits.substring(1, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
    return {
      international,
      display,
      formatted,
      isValid: true,
      isCellPhone: false,
    };
  }

  // 5. Teléfono fijo con 593 (11 dígitos: 593[2-7]xxxxxxx)
  if (digits.length === 11 && /^593[2-7]/.test(digits)) {
    const international = digits;
    const display = `0${digits.substring(3)}`;
    const formatted = `+593 ${digits.substring(3, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
    return {
      international,
      display,
      formatted,
      isValid: true,
      isCellPhone: false,
    };
  }

  // Fallback seguro si tiene al menos 8 dígitos
  if (digits.length >= 8) {
    const international = digits.startsWith('593') ? digits : `593${digits}`;
    return {
      international,
      display: digits,
      formatted: `+${international}`,
      isValid: digits.length >= 9 && digits.length <= 12,
      isCellPhone: international.startsWith('5939'),
    };
  }

  return {
    international: digits,
    display: digits,
    formatted: digits,
    isValid: false,
    isCellPhone: false,
    error: 'Número incompleto (debe tener al menos 9 o 10 dígitos en Ecuador)',
  };
}

/**
 * Genera el enlace canónico de WhatsApp (wa.me) con el número normalizado
 */
export function buildEcuadorWhatsAppUrl(phone: string, message?: string): string {
  const { international } = normalizeEcuadorPhone(phone);
  const targetNumber = international || '593998722324';
  if (message && message.trim()) {
    return `https://wa.me/${targetNumber}?text=${encodeURIComponent(message.trim())}`;
  }
  return `https://wa.me/${targetNumber}`;
}
