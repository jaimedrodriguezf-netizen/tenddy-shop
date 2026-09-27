import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tenddy | Plataforma E-Commerce B2B para Fabricantes y Mayoristas",
  description: "Despliega tu catálogo B2B, pedidos por volumen y cotizaciones directas a WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full font-sans antialiased text-slate-900 bg-white">
        {children}
      </body>
    </html>
  );
}
