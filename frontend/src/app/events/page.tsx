'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useClimateEvents } from '@/hooks/useClimateEvents';
import type { EventStatus } from '@/services/types';
import { EventCard } from '@/components/features/EventCard';
import { HiOutlineChartBar, HiOutlineFunnel } from 'react-icons/hi2';

export default function EventsPage() {
  const { t } = useLanguage();
  const { events, isLoading } = useClimateEvents();
  const [filter, setFilter] = useState<EventStatus | 'ALL'>('ALL');
  const filteredEvents = filter === 'ALL' ? events : events.filter(e => e.status === filter);

  const statusFilters: { value: EventStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: t.events.all },
    { value: 'ACTIVE', label: t.events.active },
    { value: 'SETTLED', label: t.events.settled },
    { value: 'EXPIRED', label: t.events.expired },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-(--accent) border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-(--text-muted)">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineChartBar className="w-6 h-6 text-(--accent)" />
            <h1 className="text-2xl font-bold text-(--text-primary)">{t.events.title}</h1>
          </div>
          <p className="text-sm text-(--text-muted)">{t.events.subtitle}</p>
        </div>
        <div className="flex items-center gap-1 bg-(--surface-input) p-1 rounded-xl">
          {statusFilters.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.value ? 'bg-(--accent-glow) text-(--accent)' : 'text-(--text-muted) hover:text-(--text-secondary)'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-(--text-primary) mb-4">{t.events.lifecycle}</h3>
        <div className="flex items-center gap-0">
          {[
            { label: t.events.creation, desc: t.events.eventRegistered, color: 'bg-(--chainlink)' },
            { label: t.events.open, desc: t.events.tokenPurchase, color: 'bg-(--accent)' },
            { label: t.events.monitoringStep, desc: t.events.chainlinkMeasures, color: 'bg-yellow-500' },
            { label: t.events.settlementStep, desc: t.events.oracleReturns, color: 'bg-orange-500' },
            { label: t.events.redemption, desc: t.events.automaticPayout, color: 'bg-green-500' },
          ].map((step, i) => (
            <div key={i} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full ${step.color} z-10 relative`} />
                <p className="text-[10px] font-semibold text-(--text-secondary) mt-2 text-center">{step.label}</p>
                <p className="text-[9px] text-(--text-faint) text-center hidden md:block">{step.desc}</p>
              </div>
              {i < 4 && <div className="absolute top-2 left-1/2 w-full h-0.5 bg-(--border)" />}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-(--text-faint) mb-3">{filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} {t.events.found}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map(event => (<EventCard key={event.id} event={event} showCTA={true} />))}
        </div>
        {filteredEvents.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center">
            <HiOutlineFunnel className="w-10 h-10 text-(--text-faint) mx-auto mb-3" />
            <p className="text-sm text-(--text-muted)">{t.events.noEvents}</p>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-(--border)">
          <h3 className="text-sm font-semibold text-(--text-primary)">{t.events.summary}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-(--text-faint) uppercase tracking-wider border-b border-(--border)">
                <th className="px-5 py-3">{t.events.event}</th>
                <th className="px-5 py-3">{t.events.region}</th>
                <th className="px-5 py-3">{t.events.threshold}</th>
                <th className="px-5 py-3">{t.events.period}</th>
                <th className="px-5 py-3">{t.events.tokens}</th>
                <th className="px-5 py-3">{t.events.status}</th>
                <th className="px-5 py-3">{t.events.result}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(event => (
                <tr key={event.id} className="border-b border-(--border) last:border-0 hover:bg-(--surface-hover) transition-colors">
                  <td className="px-5 py-4 font-medium text-(--text-primary)">{event.name}</td>
                  <td className="px-5 py-4 text-(--text-secondary) text-xs">{event.region}</td>
                  <td className="px-5 py-4 text-(--text-secondary)">&lt; {event.thresholdMm} mm</td>
                  <td className="px-5 py-4 text-(--text-muted) text-xs">{Math.round((event.endTime - event.startTime) / 86400)} {t.events.days}</td>
                  <td className="px-5 py-4 text-(--text-secondary)">{event.totalSupply}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${event.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : event.status === 'SETTLED' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {event.status === 'ACTIVE' ? t.events.active : event.status === 'SETTLED' ? t.events.settled : t.events.expired}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {event.status === 'SETTLED' ? (
                      <span className={`text-xs font-medium ${event.payoutTriggered ? 'text-green-400' : 'text-gray-400'}`}>{event.actualMm} mm {event.payoutTriggered ? '✅' : '❌'}</span>
                    ) : (<span className="text-xs text-(--text-faint)">—</span>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
