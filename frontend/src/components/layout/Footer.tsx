'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import Image from 'next/image';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[var(--border)] mt-auto">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 relative">
                <Image
                  src="/logo.png"
                  alt="Clim Protocol"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-base font-bold">
                <span className="gradient-text">Clim</span>
                <span className="text-[var(--text-primary)]">Protocol</span>
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{t.footer.description}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">{t.footer.resources}</h4>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><a href="https://docs.chain.link/chainlink-functions" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">Chainlink Functions</a></li>
              <li><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">Open-Meteo API</a></li>
              <li><a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">Sepolia Etherscan</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">{t.footer.project}</h4>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li>Chainlink Convergence 2026</li>
              <li>{t.footer.network}</li>
              <li>Version: 1.0.0 (MVP)</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-faint)]">© 2026 Clim Protocol — MIT License</p>
          <div className="flex items-center gap-2 text-xs text-[var(--text-faint)]">
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-green"></span>
            {t.footer.network}
          </div>
        </div>
      </div>
    </footer>
  );
}
