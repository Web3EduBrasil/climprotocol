'use client';

import { useState } from 'react';
import { SiChainlink } from 'react-icons/si';
import {
  HiOutlineClock,
  HiOutlineServerStack,
  HiOutlineGlobeAlt,
  HiOutlineShieldCheck,
  HiOutlinePencilSquare,
  HiOutlineBell,
  HiOutlineUsers,
  HiOutlineBanknotes,
  HiOutlineCpuChip,
} from 'react-icons/hi2';

interface WorkflowNode {
  id: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

const nodes: WorkflowNode[] = [
  {
    id: 'cron',
    label: 'Cron Trigger',
    sub: 'Every 6 hours',
    icon: <HiOutlineClock className="w-5 h-5" />,
    color: '#2A5ADA',
    bgColor: 'rgba(42,90,218,0.12)',
    description: 'A time-based trigger fires every 6 hours on the Chainlink DON, initiating the settlement check workflow automatically — no centralized server needed.',
  },
  {
    id: 'read',
    label: 'EVM Read',
    sub: 'getActiveEvents()',
    icon: <HiOutlineServerStack className="w-5 h-5" />,
    color: '#2A5ADA',
    bgColor: 'rgba(42,90,218,0.12)',
    description: 'The workflow reads the ClimateEventFactory contract on Sepolia to fetch all active climate events that are past their end date and ready for settlement.',
  },
  {
    id: 'http',
    label: 'HTTP Fetch',
    sub: 'Open-Meteo API',
    icon: <HiOutlineGlobeAlt className="w-5 h-5" />,
    color: '#2DD4BF',
    bgColor: 'rgba(45,212,191,0.12)',
    description: 'For each expired event, the workflow fetches real accumulated precipitation data from the Open-Meteo API using the event\'s coordinates and date range.',
  },
  {
    id: 'consensus',
    label: 'DON Consensus',
    sub: 'Median Aggregation',
    icon: <HiOutlineShieldCheck className="w-5 h-5" />,
    color: '#2A5ADA',
    bgColor: 'rgba(42,90,218,0.12)',
    description: 'Multiple DON nodes independently fetch the climate data and reach consensus using median aggregation — ensuring tamper-proof, decentralized oracle data.',
  },
  {
    id: 'write',
    label: 'EVM Write',
    sub: 'settleEvent()',
    icon: <HiOutlinePencilSquare className="w-5 h-5" />,
    color: '#2DD4BF',
    bgColor: 'rgba(45,212,191,0.12)',
    description: 'The DON signs a report and submits a transaction calling settleEvent() on the SettlementEngine smart contract with the verified precipitation data.',
  },
  {
    id: 'log',
    label: 'Log Monitor',
    sub: 'SettlementCompleted',
    icon: <HiOutlineBell className="w-5 h-5" />,
    color: '#2A5ADA',
    bgColor: 'rgba(42,90,218,0.12)',
    description: 'A second trigger listens for SettlementCompleted events on-chain to confirm successful settlement and enable token holders to redeem their payouts.',
  },
];

const actors = [
  { icon: <HiOutlineUsers className="w-4 h-4" />, label: 'Farmers', sub: 'Buy CET tokens', color: '#2DD4BF' },
  { icon: <HiOutlineBanknotes className="w-4 h-4" />, label: 'LPs', sub: 'Provide liquidity', color: '#2DD4BF' },
  { icon: <HiOutlineCpuChip className="w-4 h-4" />, label: 'CRE DON', sub: 'Orchestrates flow', color: '#2A5ADA' },
  { icon: <SiChainlink className="w-4 h-4" />, label: 'Data Feeds', sub: 'ETH/USD pricing', color: '#2A5ADA' },
];

export function CREArchitectureDiagram() {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const active = nodes.find(n => n.id === activeNode);

  return (
    <div className="glass rounded-2xl relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-[#2A5ADA]/5 via-transparent to-(--accent-glow) pointer-events-none" />

      <div className="relative z-10 p-5 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2A5ADA]/15 flex items-center justify-center">
              <SiChainlink className="w-4 h-4 text-[#2A5ADA]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-(--text-primary)">CRE Workflow Architecture</h3>
              <p className="text-[10px] text-(--text-muted)">Chainlink Compute Runtime Environment — Settlement Pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[9px] bg-green-500/15 text-green-400 px-2.5 py-1 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-green" /> Deployed on DON
            </span>
            <span className="text-[9px] bg-[#2A5ADA]/15 text-[#2A5ADA] px-2.5 py-1 rounded-full font-semibold">
              6 Capabilities
            </span>
          </div>
        </div>

        {/* Workflow Pipeline — Main visual */}
        <div className="flex items-stretch gap-1.5 md:gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin">
          {nodes.map((node, i) => (
            <div key={node.id} className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <button
                onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
                className={`group relative rounded-xl px-3 py-3 md:px-4 md:py-3.5 border transition-all duration-300 min-w-[105px] md:min-w-[120px] text-center cursor-pointer ${activeNode === node.id
                    ? 'border-(--accent) shadow-lg shadow-(--accent-glow) scale-[1.04]'
                    : 'border-(--border) hover:border-(--border-strong) hover:shadow-md'
                  }`}
                style={{
                  background: activeNode === node.id ? node.bgColor : 'var(--surface-input)',
                }}
              >
                {/* Step number badge */}
                <span className="absolute -top-2 -left-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: node.color, color: '#fff' }}>
                  {i + 1}
                </span>
                <div className="flex flex-col items-center gap-1.5">
                  <div style={{ color: node.color }}>{node.icon}</div>
                  <p className="text-[10px] md:text-xs font-bold text-(--text-primary) leading-tight">{node.label}</p>
                  <p className="text-[9px] text-(--text-muted)">{node.sub}</p>
                </div>
              </button>
              {/* Arrow connector */}
              {i < nodes.length - 1 && (
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <svg className="w-5 h-5 text-(--accent) opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail panel — shows when a node is clicked */}
        {active && (
          <div
            className="rounded-xl p-4 border border-(--border) mb-4 animate-fade-in"
            style={{ background: active.bgColor }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: active.color, color: '#fff' }}>
                {active.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-(--text-primary)">{active.label}</p>
                <p className="text-xs text-(--text-secondary) mt-1 leading-relaxed">{active.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom — actors / ecosystem */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {actors.map(a => (
            <div key={a.label} className="flex items-center gap-2 bg-(--surface-input) rounded-lg px-3 py-2 border border-(--border)">
              <div style={{ color: a.color }}>{a.icon}</div>
              <div>
                <p className="text-[10px] font-semibold text-(--text-primary)">{a.label}</p>
                <p className="text-[9px] text-(--text-muted)">{a.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tap instruction */}
        {!activeNode && (
          <p className="text-[9px] text-(--text-faint) text-center mt-3 animate-pulse">
            ↑ Tap any step to see details
          </p>
        )}
      </div>
    </div>
  );
}
