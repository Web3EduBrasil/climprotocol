'use client';

import { ReactNode } from 'react';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ServiceWorkerRegistrar } from '@/components/layout/ServiceWorkerRegistrar';

export default function ClientShell({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <ServiceWorkerRegistrar />
      <Navbar />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6">
        {children}
      </main>
      <Footer />
    </Providers>
  );
}
