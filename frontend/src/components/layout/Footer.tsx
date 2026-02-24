'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import Image from 'next/image';
import { SiChainlink } from 'react-icons/si';
import { HiOutlineCpuChip, HiOutlineBolt, HiOutlineGlobeAlt, HiOutlineChartBar } from 'react-icons/hi2';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-(--border) mt-auto">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
        {/* CRE Architecture Showcase */}
        <div className="glass rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-[#2A5ADA]/5 via-transparent to-(--accent-glow) pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <SiChainlink className="w-5 h-5 text-[#2A5ADA]" />
              <h3 className="text-sm font-bold text-(--text-primary)">Built with Chainlink CRE</h3>
              <span className="text-[9px] bg-[#2A5ADA]/15 text-[#2A5ADA] px-2 py-0.5 rounded-full font-semibold">Compute Runtime Environment</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-(--surface-input) rounded-xl p-3 border border-(--border)">
                <HiOutlineCpuChip className="w-4 h-4 text-[#2A5ADA] mb-1.5" />
                <p className="text-xs font-semibold text-(--text-primary)">CRE Workflow</p>
                <p className="text-[10px] text-(--text-muted) mt-0.5">Cron-triggered settlement orchestration on DON</p>
              </div>
              <div className="bg-(--surface-input) rounded-xl p-3 border border-(--border)">
                <HiOutlineGlobeAlt className="w-4 h-4 text-(--accent) mb-1.5" />
                <p className="text-xs font-semibold text-(--text-primary)">Functions</p>
                <p className="text-[10px] text-(--text-muted) mt-0.5">Serverless climate data from Open-Meteo API</p>
              </div>
              <div className="bg-(--surface-input) rounded-xl p-3 border border-(--border)">
                <HiOutlineBolt className="w-4 h-4 text-yellow-400 mb-1.5" />
                <p className="text-xs font-semibold text-(--text-primary)">Automation</p>
                <p className="text-[10px] text-(--text-muted) mt-0.5">Time-based triggers for event settlement</p>
              </div>
              <div className="bg-(--surface-input) rounded-xl p-3 border border-(--border)">
                <HiOutlineChartBar className="w-4 h-4 text-green-400 mb-1.5" />
                <p className="text-xs font-semibold text-(--text-primary)">Data Feeds</p>
                <p className="text-[10px] text-(--text-muted) mt-0.5">ETH/USD price feed for USD conversion</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 relative">
                <Image
                  src="/logoIcon.png"
                  alt="Clim Protocol"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-base font-bold">
                <span className="gradient-text">Clim</span>
                <span className="text-(--text-primary)">Protocol</span>
              </span>
            </div>
            <p className="text-sm text-(--text-muted) leading-relaxed">{t.footer.description}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-(--text-secondary) mb-3">{t.footer.resources}</h4>
            <ul className="space-y-2 text-sm text-(--text-muted)">
              <li><a href="https://docs.chain.link/chainlink-functions" target="_blank" rel="noopener noreferrer" className="hover:text-(--accent) transition-colors">Chainlink Functions</a></li>
              <li><a href="https://docs.chain.link/cre" target="_blank" rel="noopener noreferrer" className="hover:text-(--accent) transition-colors">Chainlink CRE</a></li>
              <li><a href="https://docs.chain.link/data-feeds" target="_blank" rel="noopener noreferrer" className="hover:text-(--accent) transition-colors">Chainlink Data Feeds</a></li>
              <li><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="hover:text-(--accent) transition-colors">Open-Meteo API</a></li>
              <li><a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer" className="hover:text-(--accent) transition-colors">Sepolia Etherscan</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-(--text-secondary) mb-3">{t.footer.project}</h4>
            <ul className="space-y-2 text-sm text-(--text-muted)">
              <li>Chainlink Convergence 2026</li>
              <li>{t.footer.network}</li>
              <li>Version: 1.0.0 (MVP)</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-(--border) flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-(--text-faint)">© 2026 Clim Protocol — MIT License</p>
          <div className="flex items-center gap-4">
            <a href="https://chain.link" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2A5ADA]/10 border border-[#2A5ADA]/20 hover:bg-[#2A5ADA]/20 transition-all text-[10px] font-medium text-[#2A5ADA]/80 hover:text-[#2A5ADA]">
              <SiChainlink className="w-3 h-3" />
              Built with Chainlink
            </a>
            <div className="flex items-center gap-2 text-xs text-(--text-faint)">
              <span className="w-2 h-2 rounded-full bg-green-500 pulse-green"></span>
              {t.footer.network}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
