import type { Metadata } from 'next';
import PlatformHomePage from '@/components/PlatformHomePage';

export const metadata: Metadata = {
  metadataBase: new URL('https://tenddy.shop'),
  title: 'tenddy | La Plataforma E-Commerce B2B para Fabricantes y Mayoristas',
  description:
    'Despliega en minutos tu catálogo corporativo con pedidos por volumen (MOQ), escalas de precios por fardo/pallet, cotizaciones automáticas y WhatsApp por sucursal.',
  keywords: [
    'ecommerce b2b',
    'catalogo mayorista',
    'pedidos por volumen',
    'cotizaciones whatsapp',
    'fabricantes y distribuidores',
    'saas multi-tenant mayorista',
    'ventas por pallet',
    'tenddy',
  ],
  alternates: {
    canonical: 'https://tenddy.shop',
  },
  openGraph: {
    title: 'tenddy | La Plataforma E-Commerce B2B para Fabricantes y Mayoristas',
    description:
      'Crea tu catálogo digital mayorista con pedidos por fardos/cajas, cotizaciones directas a WhatsApp y subdominio propio.',
    url: 'https://tenddy.shop',
    siteName: 'tenddy',
    locale: 'es_EC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'tenddy | La Plataforma E-Commerce B2B para Fabricantes y Mayoristas',
    description:
      'Crea tu catálogo digital mayorista con pedidos por fardos/cajas, cotizaciones directas a WhatsApp y subdominio propio.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootPage() {
  return <PlatformHomePage />;
}

