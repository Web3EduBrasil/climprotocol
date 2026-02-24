'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/i18n/LanguageContext';
import { useProtocolStats } from '@/hooks/useProtocolStats';
import { useClimateEvents } from '@/hooks/useClimateEvents';
import { useUserPortfolio } from '@/hooks/useUserPortfolio';
import { useETHPrice } from '@/hooks/useETHPrice';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { StatsCard } from '@/components/ui/StatsCard';
import { ParticleField } from '@/components/features/ParticleField';
import { CREArchitectureDiagram } from '@/components/features/CREArchitectureDiagram';
import { formatEther } from 'viem';
import { SiChainlink } from 'react-icons/si';
import {
  HiOutlineBanknotes, HiOutlineBolt, HiOutlineChartBarSquare,
  HiOutlineShieldCheck, HiOutlineGlobeAlt, HiOutlineCpuChip,
  HiOutlineCurrencyDollar, HiOutlineScale, HiArrowLongRight,
} from 'react-icons/hi2';

const PrecipitationChart = dynamic(
  () => import('@/components/features/PrecipitationChart').then(m => ({ default: m.PrecipitationChart })),
  {
    ssr: false,
    loading: () => (
      <div className="glass rounded-2xl p-5 flex items-center justify-center h-[340px]">
        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  },
);

/* ─── Scroll Section Wrapper ─── */
function RevealSection({ children, className = '', direction = 'up' }: {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'left' | 'right' | 'scale';
}) {
  const [ref, visible] = useScrollReveal(0.12);
  const dirClass = direction === 'left' ? 'from-left' : direction === 'right' ? 'from-right' : direction === 'scale' ? 'from-scale' : '';
  return (
    <div ref={ref} className={`${visible ? 'scroll-revealed' : 'scroll-hidden'} ${dirClass} ${className}`}>
      {children}
    </div>
  );
}

/* ─── Storytelling Step ─── */
function StoryStep({ number, title, desc, icon, accent = false, children }: {
  number: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center">
      <div className="md:col-span-2 flex md:justify-end">
        <span className="step-number">{number}</span>
      </div>
      <div className="md:col-span-10 glass rounded-2xl p-6 md:p-8 relative overflow-hidden group hover:border-[var(--border-strong)] transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-glow)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start gap-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? 'bg-[#2A5ADA]/15 text-[#2A5ADA]' : 'bg-[var(--accent-glow)] text-[var(--accent)]'}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2">{title}</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DASHBOARD / LANDING PAGE
   ═══════════════════════════════════════════ */
export default function DashboardPage() {
  const { t } = useLanguage();
  const { stats, isLoading: statsLoading } = useProtocolStats();
  const { events, isLoading: eventsLoading } = useClimateEvents();
  const { portfolio, isConnected } = useUserPortfolio();
  const { ethToUsd } = useETHPrice();

  const activeEvents = events.filter(e => e.status === 'ACTIVE');
  const totalEth = stats ? Number(formatEther(stats.totalLiquidity)) : 0;
  const loading = statsLoading || eventsLoading;

  return (
    <div className="space-y-0">

      {/* ═══════════════════════════════════
          SECTION 1 — HERO (full viewport)
          ═══════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex items-center justify-center -mx-4 sm:-mx-6 lg:-mx-10 xl:-mx-16 -mt-6 px-4 sm:px-6 lg:px-10 xl:px-16 overflow-hidden">
        {/* Particle background */}
        <ParticleField />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-primary)] pointer-events-none z-[1]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[var(--accent)]/8 via-[#2A5ADA]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)] rounded-full px-4 py-1.5 mb-8 animate-fade-in">
            <SiChainlink className="w-3.5 h-3.5 text-[#2A5ADA]" />
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Built for</span>
            <span className="text-[11px] font-bold text-[#2A5ADA]">Chainlink Convergence 2026</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-green" />
          </div>

          {/* Logo */}
          <div className="mx-auto w-36 h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 mb-8 animate-float">
            <Image
              src="/newLogo.png"
              alt="Clim Protocol"
              width={224}
              height={224}
              className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(45,212,191,0.3)]"
              priority
            />
          </div>

          {/* Main title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-[var(--text-primary)] leading-[1.05] tracking-tight animate-fade-in">
            {t.hero.title}
            <br />
            <span className="gradient-text">{t.hero.titleHighlight}</span>
          </h1>

          <p className="text-base md:text-lg text-[var(--text-muted)] mt-6 max-w-2xl mx-auto leading-relaxed animate-fade-in animate-delay-200">
            {t.hero.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mt-8 justify-center animate-fade-in animate-delay-300">
            <Link href="/protection" className="btn-primary px-8 py-3.5 text-base font-bold">
              {t.hero.buyProtection}
              <HiArrowLongRight className="inline-block ml-2 w-5 h-5" />
            </Link>
            <Link href="/liquidity" className="btn-secondary px-8 py-3.5 text-base">
              {t.hero.provideLiquidity}
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="mt-16 animate-pulse">
            <div className="w-5 h-8 border-2 border-[var(--text-faint)] rounded-full mx-auto flex justify-center pt-1.5">
              <div className="w-1 h-2 bg-[var(--accent)] rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-gradient-divider my-2" />

      {/* ═══════════════════════════════════
          SECTION 2 — LIVE STATS
          ═══════════════════════════════════ */}
      <section className="py-16">
        <RevealSection>
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.2em]">Live On-Chain Data</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mt-2">Protocol Statistics</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2">Real-time data from Sepolia smart contracts + Chainlink Data Feeds</p>
          </div>
        </RevealSection>

        <RevealSection direction="scale">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stagger-child"><StatsCard icon={<HiOutlineBanknotes className="w-5 h-5" />} label={t.stats.totalLiquidity} value={`${totalEth.toFixed(1)} ETH`} subValue={ethToUsd(totalEth) ?? undefined} trend="up" /></div>
              <div className="stagger-child"><StatsCard icon={<HiOutlineBolt className="w-5 h-5" />} label={t.stats.activeEvents} value={String(stats?.activeEvents ?? 0)} subValue={t.stats.monitoring} /></div>
              <div className="stagger-child"><StatsCard icon={<HiOutlineChartBarSquare className="w-5 h-5" />} label={t.stats.tokensSold} value={String(stats?.totalTokensSold ?? 0)} subValue={t.stats.allEvents} /></div>
              <div className="stagger-child"><StatsCard icon={<HiOutlineShieldCheck className="w-5 h-5" />} label={t.stats.collateralization} value={`${(stats?.overcollateralizationRatio ?? 0) / 10}%`} subValue={t.stats.guaranteeRatio} /></div>
            </div>
          )}
        </RevealSection>
      </section>

      <div className="section-gradient-divider" />

      {/* ═══════════════════════════════════
          SECTION 3 — HOW IT WORKS (Storytelling)
          ═══════════════════════════════════ */}
      <section className="py-16">
        <RevealSection>
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold text-[#2A5ADA] uppercase tracking-[0.2em]">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mt-2">{t.protection.howItWorks}</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2 max-w-xl mx-auto">
              From token purchase to automatic payout — fully decentralized, built with Chainlink CRE
            </p>
          </div>
        </RevealSection>

        <div className="space-y-6 md:space-y-8">
          <RevealSection direction="left">
            <StoryStep
              number="01"
              title={t.protection.step1}
              desc={t.protection.step1Desc}
              icon={<HiOutlineGlobeAlt className="w-6 h-6" />}
            >
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[9px] bg-[var(--accent-glow)] text-[var(--accent)] px-2 py-0.5 rounded-full font-medium">ERC-1155</span>
                <span className="text-[9px] bg-[var(--surface-input)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">Climate Event Factory</span>
              </div>
            </StoryStep>
          </RevealSection>

          <RevealSection direction="right">
            <StoryStep
              number="02"
              title={t.protection.step2}
              desc={t.protection.step2Desc}
              icon={<HiOutlineCurrencyDollar className="w-6 h-6" />}
            >
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[9px] bg-[var(--accent-glow)] text-[var(--accent)] px-2 py-0.5 rounded-full font-medium">Liquidity Pool</span>
                <span className="text-[9px] bg-[var(--surface-input)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">Premium → Collateral</span>
              </div>
            </StoryStep>
          </RevealSection>

          <RevealSection direction="left">
            <StoryStep
              number="03"
              title={t.protection.step3}
              desc={t.protection.step3Desc}
              accent
              icon={<HiOutlineCpuChip className="w-6 h-6" />}
            >
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[9px] bg-[#2A5ADA]/15 text-[#2A5ADA] px-2 py-0.5 rounded-full font-bold">CRE Workflow</span>
                <span className="text-[9px] bg-[#2A5ADA]/10 text-[#2A5ADA]/70 px-2 py-0.5 rounded-full">Chainlink Functions</span>
                <span className="text-[9px] bg-[#2A5ADA]/10 text-[#2A5ADA]/70 px-2 py-0.5 rounded-full">Automation</span>
                <span className="text-[9px] bg-[#2A5ADA]/10 text-[#2A5ADA]/70 px-2 py-0.5 rounded-full">DON Consensus</span>
              </div>
            </StoryStep>
          </RevealSection>

          <RevealSection direction="right">
            <StoryStep
              number="04"
              title={t.protection.step4}
              desc={t.protection.step4Desc}
              icon={<HiOutlineScale className="w-6 h-6" />}
            >
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[9px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-medium">Automatic Settlement</span>
                <span className="text-[9px] bg-[var(--surface-input)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">Settlement Engine</span>
              </div>
            </StoryStep>
          </RevealSection>
        </div>
      </section>

      <div className="section-gradient-divider" />

      {/* ═══════════════════════════════════
          SECTION 4 — CRE ARCHITECTURE
          ═══════════════════════════════════ */}
      <section className="py-16">
        <RevealSection>
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold text-[#2A5ADA] uppercase tracking-[0.2em]">Deep Dive</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mt-2">CRE Workflow Architecture</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2 max-w-xl mx-auto">
              Tap any step to explore how the Chainlink DON orchestrates settlement
            </p>
          </div>
        </RevealSection>

        <RevealSection direction="scale">
          <CREArchitectureDiagram />
        </RevealSection>
      </section>

      <div className="section-gradient-divider" />

      {/* ═══════════════════════════════════
          SECTION 5 — LIVE CLIMATE DATA
          ═══════════════════════════════════ */}
      <section className="py-16">
        <RevealSection>
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.2em]">Real-Time Oracle Data</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mt-2">{t.chart.title}</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2">Open-Meteo API → Chainlink Functions → On-Chain Verification</p>
          </div>
        </RevealSection>

        <RevealSection>
          <PrecipitationChart threshold={150} />
        </RevealSection>
      </section>

      <div className="section-gradient-divider" />

      {/* ═══════════════════════════════════
          SECTION 6 — ACTIVE EVENTS
          ═══════════════════════════════════ */}
      <section className="py-16">
        <RevealSection>
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.2em]">Marketplace</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mt-1">{t.events.activeEventsTitle}</h2>
            </div>
            <Link href="/events" className="btn-secondary text-xs px-4 py-2">{t.events.viewAll}</Link>
          </div>
        </RevealSection>

        <RevealSection direction="scale">
          {activeEvents.length === 0 ? (
            <div className="glass rounded-2xl p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-glow)] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <HiOutlineBolt className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-4" />
                <p className="text-base text-[var(--text-muted)] font-medium">No active events at the moment.</p>
                <p className="text-xs text-[var(--text-faint)] mt-2 max-w-sm mx-auto">Events will appear here when created by an admin on the blockchain. Visit the Admin panel to create one.</p>
                <Link href="/admin" className="inline-block mt-6 btn-primary text-xs px-5 py-2.5">
                  Go to Admin Panel <HiArrowLongRight className="inline ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="stagger-child glass rounded-2xl p-5 card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{event.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">{event.region}</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-green" />
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
          )}
        </RevealSection>
      </section>

      {/* ═══════════════════════════════════
          SECTION 7 — PORTFOLIO (connected only)
          ═══════════════════════════════════ */}
      {isConnected && portfolio.length > 0 && (
        <section className="pb-16">
          <div className="section-gradient-divider mb-16" />
          <RevealSection>
            <div className="glass rounded-2xl p-6">
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
                    {portfolio.map(item => (
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
          </RevealSection>
        </section>
      )}
    </div>
  );
}
