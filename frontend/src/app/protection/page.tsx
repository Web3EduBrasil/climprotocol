'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { BuyModal } from '@/components/features/BuyModal';
import { mockEvents } from '@/config/mockData';
import type { ClimateEvent } from '@/services/types';
import { formatEther } from 'viem';
import { HiOutlineShieldCheck, HiOutlineFunnel } from 'react-icons/hi2';

export default function ProtectionPage() {
  const { t } = useLanguage();
  const [selectedEvent, setSelectedEvent] = useState<ClimateEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const activeEvents = mockEvents.filter(e => e.status === 'ACTIVE');

  const handleBuy = (event: ClimateEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineShieldCheck className="w-6 h-6 text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.protection.title}</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">{t.protection.subtitle}</p>
        </div>
        <button className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3">
          <HiOutlineFunnel className="w-3.5 h-3.5" />
          {t.protection.filter}
        </button>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t.protection.howItWorks}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '1', title: t.protection.step1, desc: t.protection.step1Desc },
            { step: '2', title: t.protection.step2, desc: t.protection.step2Desc },
            { step: '3', title: t.protection.step3, desc: t.protection.step3Desc },
            { step: '4', title: t.protection.step4, desc: t.protection.step4Desc },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[var(--accent)]">{item.step}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{item.title}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{t.protection.available} ({activeEvents.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeEvents.map(event => (
            <div key={event.id} className="glass rounded-2xl p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{event.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{event.region}, {event.state}</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-green"></span>
                  {t.events.active}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider">{t.protection.location}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{event.latitude.toFixed(2)}°, {event.longitude.toFixed(2)}°</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider">{t.events.threshold}</p>
                  <p className="text-sm text-[var(--text-secondary)]">&lt; {event.thresholdMm} mm</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider">{t.events.period}</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {new Date(event.startTime * 1000).toLocaleDateString('pt-BR')} — {new Date(event.endTime * 1000).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider">{t.protection.duration}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{Math.round((event.endTime - event.startTime) / 86400)} {t.events.days}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-[var(--accent-glow)] to-[rgba(42,90,218,0.05)] rounded-xl p-3 mb-4 border border-[var(--border)]">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.protection.premium}</p>
                    <p className="text-sm text-[var(--text-primary)] font-semibold">{Number(formatEther(event.premiumPerToken)).toFixed(4)} ETH</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.protection.payout}</p>
                    <p className="text-sm text-[var(--accent)] font-semibold">{Number(formatEther(event.payoutPerToken)).toFixed(3)} ETH</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.protection.returnPct}</p>
                    <p className="text-sm text-[var(--accent)] font-semibold">+{((Number(formatEther(event.payoutPerToken)) / Number(formatEther(event.premiumPerToken)) - 1) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-muted)]">{t.protection.availableTokens}</span>
                  <span className="text-[var(--text-secondary)]">{event.availableTokens} / {event.totalSupply}</span>
                </div>
                <div className="h-1.5 bg-[var(--surface-input)] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--chainlink)] rounded-full transition-all" style={{ width: `${(event.availableTokens / event.totalSupply) * 100}%` }}></div>
                </div>
              </div>
              <button onClick={() => handleBuy(event)} className="btn-primary w-full text-sm">{t.protection.buyButton}</button>
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <BuyModal event={selectedEvent} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }} />
      )}
    </div>
  );
}
