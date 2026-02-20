import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ServiceWorkerRegistrar } from '../components/layout/ServiceWorkerRegistrar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clim Protocol — Proteção Paramétrica contra Seca',
  description: 'Seguro paramétrico descentralizado contra seca para agricultores familiares do Semiárido de Pernambuco. Chainlink Functions & Automation.',
  keywords: ['DeFi', 'Chainlink', 'Climate', 'Insurance', 'Agriculture', 'Blockchain', 'Parametric'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Clim Protocol',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#2DD4BF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// Inline script to set data-theme BEFORE React hydrates, preventing flash
const themeScript = `
  (function(){
    try {
      var t = localStorage.getItem('clim-theme');
      if (t === 'light' || t === 'dark') {
        document.documentElement.setAttribute('data-theme', t);
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch(e) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <ServiceWorkerRegistrar />
          <Navbar />
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
