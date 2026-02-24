'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useLanguage } from '@/i18n/LanguageContext';
import type { PrecipitationDataPoint } from '@/services/types';

interface PrecipitationChartProps {
  threshold?: number;
  latitude?: number;
  longitude?: number;
  className?: string;
}

/**
 * Fetches daily precipitation data from Open-Meteo API and displays an accumulated chart.
 * Defaults to Araripina, PE coordinates if none provided.
 */
export function PrecipitationChart({ threshold = 150, latitude = -7.57, longitude = -40.50, className = '' }: PrecipitationChartProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<PrecipitationDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrecipitation = async () => {
      try {
        // Fetch last 90 days of daily precipitation from Open-Meteo
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 90);

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum&start_date=${startStr}&end_date=${endStr}&timezone=America/Recife`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.daily?.time && json.daily?.precipitation_sum) {
          let accumulated = 0;
          const points: PrecipitationDataPoint[] = json.daily.time.map((date: string, i: number) => {
            const daily = json.daily.precipitation_sum[i] ?? 0;
            accumulated += daily;
            return {
              day: i + 1,
              date: new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
              daily: Math.round(daily * 10) / 10,
              accumulated: Math.round(accumulated * 10) / 10,
            };
          });
          setData(points);
        }
      } catch (err) {
        console.error('Failed to fetch precipitation data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrecipitation();
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className={`glass rounded-2xl p-5 ${className}`}>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-(--text-muted)">Buscando dados climáticos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-(--text-primary)">{t.chart.title}</h3>
          <p className="text-xs text-(--text-muted) mt-0.5">{t.chart.subtitle}</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-(--accent) rounded-full"></div>
            <span className="text-(--text-muted)">{t.chart.accumulated}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-red-400 rounded-full border-dashed"></div>
            <span className="text-(--text-muted)">Threshold ({threshold} mm)</span>
          </div>
          <span className="text-[9px] text-(--text-faint) bg-(--surface-input) px-2 py-0.5 rounded">Open-Meteo</span>
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
