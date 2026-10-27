import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' blob: data: https://*.supabase.co https://lh3.googleusercontent.com https://images.unsplash.com https:;
  media-src 'self' blob: data: https://*.supabase.co https://commondatastorage.googleapis.com https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https:;
  frame-src 'self' https://wa.me https://www.google.com https://maps.google.com;
  frame-ancestors 'self';
  base-uri 'self';
  form-action 'self' https://wa.me;
`
  .replace(/\s{2,}/g, ' ')
  .trim();

const securityHeaders = [
  // Content-Security-Policy (Defensa en profundidad contra XSS e inyecciones externas)
  {
    key: "Content-Security-Policy",
    value: cspHeader,
  },
  // Protección contra Clickjacking para sitios de terceros pero permitiendo mismo origen (por iframe de standalone)
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // Protección contra MIME-type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Referrer Policy para proteger datos de navegación sensibles
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Deshabilitar características de hardware no requeridas
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Forzar HTTPS en producción (HSTS)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["100.68.45.33", "100.68.45.33:3000", "localhost:3000"],
  async headers() {
    return [
      {
        // Aplicar estas cabeceras a todas las rutas de la plataforma
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
