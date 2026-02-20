'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { mockEvents, mockPortfolio } from '@/config/mockData';
import { formatEther } from 'viem';
import { HiOutlineScale, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineBolt } from 'react-icons/hi2';

export default function SettlementPage() {
  const { t } = useLanguage();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemedIds, setRedeemedIds] = useState<Set<string>>(new Set());
  const settledEvents = mockEvents.filter(e => e.status === 'SETTLED');

  const handleRedeem = (eventId: string) => {
    setRedeemingId(eventId);
    setTimeout(() => { setRedeemedIds(prev => new Set([...prev, eventId])); setRedeemingId(null); }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HiOutlineScale className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.settlement.title}</h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{t.settlement.subtitle}</p>
      </div>

      <div className="space-y-4">
        {settledEvents.map(event => {
          const userItem = mockPortfolio.find(p => p.eventId === event.eventId);
          const hasTokens = userItem && userItem.tokenBalance > 0;
          const isRedeemed = redeemedIds.has(event.id);
          const isRedeeming = redeemingId === event.id;

          return (
            <div key={event.id} className="glass rounded-2xl overflow-hidden card-hover">
              <div className={`px-5 py-3 flex items-center gap-2 ${event.payoutTriggered ? 'bg-gradient-to-r from-green-500/10 to-green-500/5 border-b border-green-500/10' : 'bg-gradient-to-r from-gray-500/10 to-gray-500/5 border-b border-gray-500/10'}`}>
                {event.payoutTriggered ? (
                  <><HiOutlineCheckCircle className="w-5 h-5 text-green-400" /><span className="text-sm font-semibold text-green-400">{t.settlement.payoutTriggered}</span></>
                ) : (
                  <><HiOutlineXCircle className="w-5 h-5 text-gray-400" /><span className="text-sm font-semibold text-gray-400">{t.settlement.noPayout}</span></>
                )}
              </div>

              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{event.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{event.region}, {event.state}</p>
                  </div>
                  <span className="text-xs text-[var(--text-faint)]">
                    {new Date(event.startTime * 1000).toLocaleDateString('pt-BR')} — {new Date(event.endTime * 1000).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="bg-[var(--surface-input)] rounded-xl p-5 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-[var(--text-muted)]">{t.settlement.recordedVsThreshold}</span>
                    <span className="text-xs text-[var(--text-muted)]">{t.settlement.dataVia} <span className="text-[var(--chainlink)] font-medium">Chainlink Functions</span></span>
                  </div>
                  <div className="relative h-12 bg-[var(--bg-primary)] rounded-lg overflow-hidden mb-3">
                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-20" style={{ left: `${Math.min((event.thresholdMm / 300) * 100, 100)}%` }}>
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-red-400 whitespace-nowrap font-medium">Trigger: {event.thresholdMm}mm</div>
                    </div>
                    <div className={`absolute top-0 bottom-0 left-0 rounded-r-lg transition-all duration-1000 ${event.payoutTriggered ? 'bg-gradient-to-r from-green-500/30 to-green-500/50' : 'bg-gradient-to-r from-gray-500/30 to-gray-500/50'}`} style={{ width: `${Math.min(((event.actualMm || 0) / 300) * 100, 100)}%` }}>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-primary)]">{event.actualMm} mm</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.settlement.recorded}</p>
                      <p className={`text-lg font-bold ${event.payoutTriggered ? 'text-green-400' : 'text-gray-400'}`}>{event.actualMm} mm</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.settlement.threshold}</p>
                      <p className="text-lg font-bold text-red-400">{event.thresholdMm} mm</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.settlement.difference}</p>
                      <p className={`text-lg font-bold ${event.payoutTriggered ? 'text-green-400' : 'text-gray-400'}`}>{event.payoutTriggered ? '-' : '+'}{Math.abs((event.actualMm || 0) - event.thresholdMm)} mm</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="bg-[var(--surface-input)] rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.settlement.supply}</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{event.totalSupply} CET</p>
                  </div>
                  <div className="bg-[var(--surface-input)] rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.settlement.payoutPerToken}</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{Number(formatEther(event.payoutPerToken)).toFixed(3)} ETH</p>
                  </div>
                  <div className="bg-[var(--surface-input)] rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.settlement.totalPayout}</p>
                    <p className={`text-sm font-bold ${event.payoutTriggered ? 'text-[var(--accent)]' : 'text-gray-400'}`}>
                      {event.payoutTriggered ? `${(Number(formatEther(event.payoutPerToken)) * event.totalSupply).toFixed(2)} ETH` : '0 ETH'}
                    </p>
                  </div>
                  <div className="bg-[var(--surface-input)] rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[var(--text-faint)] uppercase">{t.settlement.resultLabel}</p>
                    <p className={`text-sm font-bold ${event.payoutTriggered ? 'text-green-400' : 'text-gray-400'}`}>{event.payoutTriggered ? t.settlement.drought : t.settlement.rain}</p>
                  </div>
                </div>

                {hasTokens && event.payoutTriggered && (
                  <div className="bg-gradient-to-r from-[var(--accent-glow)] to-green-500/5 rounded-xl p-4 border border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{t.settlement.youHave} {userItem!.tokenBalance} {t.settlement.tokensToRedeem}</p>
                        <p className="text-xs text-[var(--accent)] mt-0.5">{t.protection.payout}: {Number(formatEther(userItem!.potentialPayout)).toFixed(4)} ETH</p>
                      </div>
                      <button onClick={() => handleRedeem(event.id)} disabled={isRedeeming || isRedeemed} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isRedeemed ? 'bg-green-500 text-white' : isRedeeming ? 'opacity-50 cursor-wait btn-primary' : 'btn-primary'}`}>
                        {isRedeemed && t.settlement.redeemed}
                        {isRedeeming && t.settlement.redeeming}
                        {!isRedeemed && !isRedeeming && (<span className="flex items-center gap-1.5"><HiOutlineBolt className="w-4 h-4" />{t.settlement.redeemPayout}</span>)}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {settledEvents.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <HiOutlineScale className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">{t.settlement.noSettled}</p>
          <p className="text-xs text-[var(--text-faint)] mt-1">{t.settlement.autoSettlement}</p>
        </div>
      )}
    </div>
  );
}
