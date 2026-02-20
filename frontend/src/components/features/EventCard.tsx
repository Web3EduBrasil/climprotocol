'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { MockClimateEvent } from '@/types';
import { formatEther } from 'viem';
import Link from 'next/link';

interface EventCardProps {
  event: MockClimateEvent;
  showCTA?: boolean;
}

export function EventCard({ event, showCTA = true }: EventCardProps) {
  const { t } = useLanguage();

  const statusConfig = {
    ACTIVE: { label: t.events.active, color: 'bg-green-500', textColor: 'text-green-400', bgColor: 'bg-green-500/10' },
    SETTLED: { label: t.events.settled, color: 'bg-blue-500', textColor: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    EXPIRED: { label: t.events.expired, color: 'bg-gray-500', textColor: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  };

  const status = statusConfig[event.status];
  const startDate = new Date(event.startTime * 1000).toLocaleDateString('pt-BR');
  const endDate = new Date(event.endTime * 1000).toLocaleDateString('pt-BR');
  const premiumEth = formatEther(event.premiumPerToken);
  const payoutEth = formatEther(event.payoutPerToken);

  return (
    <div className="glass rounded-2xl p-5 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{event.name}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{event.region}, {event.state}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${status.bgColor} ${status.textColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.color} ${event.status === 'ACTIVE' ? 'pulse-green' : ''}`}></span>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider">{t.events.period}</p>
          <p className="text-sm text-[var(--text-secondary)] font-medium">{startDate} — {endDate}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider">{t.events.threshold}</p>
          <p className="text-sm text-[var(--text-secondary)] font-medium">&lt; {event.thresholdMm} mm</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider">{t.protection.premium}</p>
          <p className="text-sm text-[var(--accent)] font-semibold">{Number(premiumEth).toFixed(4)} ETH</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider">{t.settlement.payoutPerToken}</p>
          <p className="text-sm text-[var(--text-secondary)] font-medium">{Number(payoutEth).toFixed(3)} ETH</p>
        </div>
      </div>

      {event.status === 'ACTIVE' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--text-muted)]">{t.protection.availableTokens}</span>
            <span className="text-[var(--text-secondary)]">{event.availableTokens} / {event.totalSupply}</span>
          </div>
          <div className="h-1.5 bg-[var(--surface-input)] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--chainlink)] rounded-full transition-all duration-500" style={{ width: `${(event.availableTokens / event.totalSupply) * 100}%` }}></div>
          </div>
        </div>
      )}

      {event.status === 'SETTLED' && event.actualMm !== undefined && (
        <div className={`rounded-xl p-3 mb-4 ${event.payoutTriggered ? 'bg-green-500/5 border border-green-500/20' : 'bg-gray-500/5 border border-gray-500/20'}`}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">{t.settlement.recorded}</span>
            <span className={`font-semibold ${event.payoutTriggered ? 'text-green-400' : 'text-gray-400'}`}>{event.actualMm} mm</span>
          </div>
          <p className={`text-xs mt-1 font-medium ${event.payoutTriggered ? 'text-green-400' : 'text-gray-400'}`}>
            {event.payoutTriggered ? `✅ ${t.settlement.payoutTriggered}` : `❌ ${t.settlement.noPayout}`}
          </p>
        </div>
      )}

      {showCTA && event.status === 'ACTIVE' && (
        <Link href="/protection" className="btn-primary block text-center text-sm">{t.protection.buyButton}</Link>
      )}
      {showCTA && event.status === 'SETTLED' && event.payoutTriggered && (
        <Link href="/settlement" className="btn-secondary block text-center text-sm">{t.settlement.title}</Link>
      )}
    </div>
  );
}
