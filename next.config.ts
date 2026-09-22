import type { NextConfig } from "next";

const securityHeaders = [
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
