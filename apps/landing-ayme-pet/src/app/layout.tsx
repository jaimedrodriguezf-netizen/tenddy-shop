import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AYME INDUSTRIAS PET | Soluciones Integrales en Envases & Soplado B2B',
  description: 'Fabricación y maquila industrial de envases, preformas y botellas PET en Quito, Ecuador. Despacho nacional paletizado.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#0a1128] text-white selection:bg-[#A61C2E] selection:text-white">
        {children}
      </body>
    </html>
  );
}
