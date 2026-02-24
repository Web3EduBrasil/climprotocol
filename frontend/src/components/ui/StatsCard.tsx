'use client';

import { ReactNode } from 'react';

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatsCard({ icon, label, value, subValue, trend }: StatsCardProps) {
  return (
    <div className="glass rounded-2xl p-4 card-hover relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-bl from-(--accent-glow) to-transparent rounded-bl-full opacity-50" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-(--accent)">{icon}</div>
          {trend === 'up' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-green ml-auto" />}
        </div>
        <p className="text-2xl font-bold text-(--text-primary)">{value}</p>
        <p className="text-xs text-(--text-muted) mt-1">{label}</p>
        {subValue && <p className="text-[10px] text-(--accent) mt-0.5 opacity-70">{subValue}</p>}
      </div>
    </div>
  );
}
