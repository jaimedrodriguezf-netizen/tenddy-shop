import type { Metadata } from "next";
import "../../public/css/style.css";

export const metadata: Metadata = {
  title: "AYME INDUSTRIAS PET | Solutions in Packaging",
  description: "Fabricación de envases, botellas y tapas en PET y PP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Instrument+Sans:wght@400;500;600;700;800&family=Montserrat:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/css/style.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
