'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/i18n/LanguageContext';
import { mockProtocolStats, mockEvents, mockPortfolio } from '@/config/mockData';
import { StatsCard } from '@/components/ui/StatsCard';
import { PrecipitationChart } from '@/components/features/PrecipitationChart';
import { formatEther } from 'viem';
import { HiOutlineBanknotes, HiOutlineBolt, HiOutlineChartBarSquare, HiOutlineShieldCheck } from 'react-icons/hi2';

export default function DashboardPage() {
  const { t } = useLanguage();
  const stats = mockProtocolStats;
  const activeEvents = mockEvents.filter(e => e.status === 'ACTIVE');
  const totalEth = Number(formatEther(stats.totalLiquidity));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="glass rounded-2xl p-8 md:p-12 relative overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-glow)] via-transparent to-[rgba(42,90,218,0.05)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[var(--accent)]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          {/* Text Content */}
          <div className="flex-1 max-w-2xl text-center md:text-left">
            <span className="text-xs font-medium text-[var(--accent)] tracking-wider uppercase opacity-80">{t.hero.region}</span>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mt-3 leading-tight">
              {t.hero.title} <span className="gradient-text">{t.hero.titleHighlight}</span>
            </h1>
            <p className="text-sm md:text-base text-[var(--text-muted)] mt-4 leading-relaxed">{t.hero.subtitle}</p>
            <div className="flex gap-3 mt-6 justify-center md:justify-start">
              <Link href="/protection" className="btn-primary text-sm">{t.hero.buyProtection}</Link>
              <Link href="/liquidity" className="btn-secondary text-sm">{t.hero.provideLiquidity}</Link>
            </div>
          </div>

          {/* Hero Image / Logo */}
          <div className="flex-shrink-0 w-32 h-32 md:w-56 md:h-56 lg:w-64 lg:h-64 relative flex items-center justify-center">
             <Image 
               src="/logo.png" 
               alt="Clim Protocol" 
               width={256} 
               height={256} 
               className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(45,212,191,0.2)]"
               priority
             />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-scale-in animate-delay-100"><StatsCard icon={<HiOutlineBanknotes className="w-5 h-5" />} label={t.stats.totalLiquidity} value={`${totalEth.toFixed(1)} ETH`} trend="up" /></div>
        <div className="animate-scale-in animate-delay-200"><StatsCard icon={<HiOutlineBolt className="w-5 h-5" />} label={t.stats.activeEvents} value={String(stats.activeEvents)} subValue={t.stats.monitoring} /></div>
        <div className="animate-scale-in animate-delay-300"><StatsCard icon={<HiOutlineChartBarSquare className="w-5 h-5" />} label={t.stats.tokensSold} value={String(stats.totalTokensSold)} subValue={t.stats.allEvents} /></div>
        <div className="animate-scale-in animate-delay-400"><StatsCard icon={<HiOutlineShieldCheck className="w-5 h-5" />} label={t.stats.collateralization} value={`${stats.overcollateralizationRatio / 10}%`} subValue={t.stats.guaranteeRatio} /></div>
      </div>

      {/* Chart */}
      <div className="animate-fade-in animate-delay-300">
        <PrecipitationChart threshold={150} />
      </div>

      {/* Active Events */}
      <div className="animate-fade-in animate-delay-400">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t.events.activeEventsTitle}</h2>
          <Link href="/events" className="text-xs text-[var(--accent)] hover:opacity-80 transition-colors">{t.events.viewAll}</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeEvents.slice(0, 6).map((event, i) => (
            <div key={event.id} className={`glass rounded-2xl p-5 card-hover animate-scale-in animate-delay-${(i + 1) * 100}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{event.name}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{event.region}</p>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-green"></span>
                  {t.events.active}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.events.threshold}</p>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">&lt; {event.thresholdMm} mm</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.events.tokens}</p>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">{event.availableTokens}/{event.totalSupply}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.protection.payout}</p>
                  <p className="text-xs font-medium text-[var(--accent)]">{Number(formatEther(event.payoutPerToken)).toFixed(3)} ETH</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio */}
      {mockPortfolio.length > 0 && (
        <div className="glass rounded-2xl p-6 animate-fade-in animate-delay-500">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{t.portfolio.title}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--text-faint)] uppercase tracking-wider border-b border-[var(--border)]">
                  <th className="pb-3 pr-4">{t.portfolio.event}</th>
                  <th className="pb-3 pr-4">{t.portfolio.tokens}</th>
                  <th className="pb-3 pr-4">{t.portfolio.potentialPayout}</th>
                  <th className="pb-3">{t.portfolio.status}</th>
                </tr>
              </thead>
              <tbody>
                {mockPortfolio.map(item => (
                  <tr key={String(item.eventId)} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-3 pr-4 text-[var(--text-primary)] font-medium">{item.eventName}</td>
                    <td className="py-3 pr-4 text-[var(--text-secondary)]">{item.tokenBalance}</td>
                    <td className="py-3 pr-4 text-[var(--accent)]">{Number(formatEther(item.potentialPayout)).toFixed(4)} ETH</td>
                    <td className="py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : item.status === 'SETTLED' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>
                        {item.status === 'ACTIVE' ? t.events.active : item.status === 'SETTLED' ? t.events.settled : t.events.expired}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
