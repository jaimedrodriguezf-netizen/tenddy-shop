import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || 'localhost:3000';

  // Omitir peticiones internas de Next.js, APIs y archivos estáticos con extensión
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extraer el host limpio sin puerto
  const currentHost = hostname.split(':')[0].toLowerCase();
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'tenddy.shop').toLowerCase();

  // Si la petición es por IP directa (ej: Tailscale 100.x.x.x o localhost), o si la ruta ya incluye /store
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(currentHost);
  if (
    currentHost === 'localhost' ||
    currentHost === '127.0.0.1' ||
    isIpAddress ||
    url.pathname.startsWith('/store')
  ) {
    return NextResponse.next();
  }

  // Detectar si es subdominio o dominio propio
  let detectedSlug: string | null = null;
  if (currentHost.endsWith(`.${rootDomain}`)) {
    detectedSlug = currentHost.replace(`.${rootDomain}`, '');
  } else if (currentHost.endsWith('.localhost') && currentHost !== 'localhost') {
    detectedSlug = currentHost.replace('.localhost', '');
  } else if (
    currentHost !== rootDomain &&
    currentHost !== `www.${rootDomain}`
  ) {
    detectedSlug = currentHost;
  }

  if (detectedSlug) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-shop-slug', detectedSlug);
    requestHeaders.set('x-current-host', currentHost);

    return NextResponse.rewrite(
      new URL(`/store/${detectedSlug}${url.pathname}`, request.url),
      {
        request: {
          headers: requestHeaders,
        },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
};
