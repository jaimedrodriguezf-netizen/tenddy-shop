// Sistema de Rate Limiting en memoria para protección contra bots y ataques de fuerza bruta
interface RateLimitEntry {
  count: number;
  firstRequestTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Limpieza periódica de memoria cada 5 minutos para evitar fugas de memoria
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.firstRequestTime > 1000 * 60 * 15) {
      rateLimitMap.delete(key);
    }
  }
}, 1000 * 60 * 5);

export interface RateLimitOptions {
  windowMs: number; // Ventana de tiempo (ej. 1 minuto)
  maxRequests: number; // Máximo de peticiones permitidas por IP en esa ventana
}

export function checkRateLimit(ip: string, options: RateLimitOptions = { windowMs: 60000, maxRequests: 10 }): { isAllowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return { isAllowed: true, remaining: options.maxRequests - 1 };
  }

  // Si la ventana de tiempo ya pasó, reseteamos el contador
  if (now - entry.firstRequestTime > options.windowMs) {
    rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return { isAllowed: true, remaining: options.maxRequests - 1 };
  }

  // Si sigue dentro de la ventana de tiempo
  entry.count++;
  if (entry.count > options.maxRequests) {
    return { isAllowed: false, remaining: 0 };
  }

  return { isAllowed: true, remaining: options.maxRequests - entry.count };
}

// Obtener la IP real del cliente considerando proxies inversos (Hostinger, Cloudflare, Nginx)
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return '127.0.0.1';
}
