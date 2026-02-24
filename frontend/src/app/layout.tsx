import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ServiceWorkerRegistrar } from '../components/layout/ServiceWorkerRegistrar';
import { BASE_PATH } from '@/config/basePath';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const siteUrl = 'https://web3edubrasil.github.io/climprotocol';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Clim Protocol — Parametric Drought Protection',
  description: 'Decentralized parametric climate insurance for smallholder farmers in the Brazilian Semiárido. Built with Chainlink CRE, Functions & Automation.',
  keywords: ['DeFi', 'Chainlink', 'Climate', 'Insurance', 'Agriculture', 'Blockchain', 'Parametric'],
  manifest: `${BASE_PATH}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Clim Protocol',
  },
  icons: {
    icon: `${BASE_PATH}/logoIcon.png`,
    apple: `${BASE_PATH}/logoIcon.png`,
  },
  openGraph: {
    type: 'website',
    siteName: 'Clim Protocol',
    title: 'Clim Protocol — Parametric Drought Protection',
    description: 'Decentralized parametric climate insurance for smallholder farmers in the Brazilian Semiárido. Built with Chainlink CRE.',
    url: siteUrl,
    images: [
      {
        url: `${BASE_PATH}/newLogo.png`,
        width: 512,
        height: 512,
        alt: 'Clim Protocol Logo',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Clim Protocol — Parametric Drought Protection',
    description: 'Decentralized parametric climate insurance for smallholder farmers in the Brazilian Semiárido.',
    images: [`${BASE_PATH}/newLogo.png`],
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
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
