'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const base = process.env.NODE_ENV === 'production' ? '/climprotocol' : '';
      navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {
        // SW registration failed — non-critical
      });
    }
  }, []);

  return null;
}
