'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { mockPrecipitationData } from '@/config/mockData';
import { useLanguage } from '@/i18n/LanguageContext';

interface PrecipitationChartProps {
  threshold?: number;
  className?: string;
}

export function PrecipitationChart({ threshold = 150, className = '' }: PrecipitationChartProps) {
  const { t } = useLanguage();
  const data = mockPrecipitationData;

  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t.chart.title}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.chart.subtitle}</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[var(--accent)] rounded-full"></div>
            <span className="text-[var(--text-muted)]">{t.chart.accumulated}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-red-400 rounded-full border-dashed"></div>
            <span className="text-[var(--text-muted)]">Threshold ({threshold} mm)</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="precipGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(128,128,128,0.5)' }} interval={14} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(128,128,128,0.5)' }} tickFormatter={(val) => `${val}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-strong)',
              border: '1px solid var(--border-strong)',
              borderRadius: '12px',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
            formatter={(value: number | string | undefined) => [`${value ?? 0} mm`, t.chart.accumulated]}
            labelFormatter={(label) => `${t.chart.day}: ${label}`}
          />
          <ReferenceLine
            y={threshold}
            stroke="#ef4444"
            strokeDasharray="6 4"
            strokeOpacity={0.6}
            label={{
              value: `Trigger: ${threshold}mm`,
              position: 'right',
              fontSize: 10,
              fill: 'rgba(239,68,68,0.6)',
            }}
          />
          <Area type="monotone" dataKey="accumulated" stroke="#2DD4BF" strokeWidth={2} fill="url(#precipGradient)" animationDuration={1500} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
