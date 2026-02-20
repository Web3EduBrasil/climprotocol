'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { mockProtocolStats, mockLPHistory } from '@/config/mockData';
import { StatsCard } from '@/components/ui/StatsCard';
import { formatEther } from 'viem';
import { HiOutlineBanknotes, HiOutlineLockClosed, HiOutlineArrowTrendingUp, HiOutlineShieldCheck } from 'react-icons/hi2';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LiquidityPage() {
  const { t } = useLanguage();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositStatus, setDepositStatus] = useState<'idle' | 'pending' | 'success'>('idle');
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'pending' | 'success'>('idle');

  const stats = mockProtocolStats;
  const totalEth = Number(formatEther(stats.totalLiquidity));
  const availableEth = Number(formatEther(stats.availableLiquidity));
  const lockedEth = Number(formatEther(stats.lockedCollateral));
  const mockUserLPBalance = 5.2;
  const mockYield = 0.32;

  const handleDeposit = () => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    setDepositStatus('pending');
    setTimeout(() => { setDepositStatus('success'); setTimeout(() => { setDepositStatus('idle'); setDepositAmount(''); }, 2000); }, 1500);
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > mockUserLPBalance) return;
    setWithdrawStatus('pending');
    setTimeout(() => { setWithdrawStatus('success'); setTimeout(() => { setWithdrawStatus('idle'); setWithdrawAmount(''); }, 2000); }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HiOutlineBanknotes className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.liquidity.title}</h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{t.liquidity.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<HiOutlineBanknotes className="w-5 h-5" />} label={t.stats.totalLiquidity} value={`${totalEth.toFixed(1)} ETH`} trend="up" />
        <StatsCard icon={<HiOutlineArrowTrendingUp className="w-5 h-5" />} label={t.stats.available} value={`${availableEth.toFixed(1)} ETH`} subValue={`${((availableEth / totalEth) * 100).toFixed(0)}% ${t.stats.ofTotal}`} trend="neutral" />
        <StatsCard icon={<HiOutlineLockClosed className="w-5 h-5" />} label={t.liquidity.lockedCollateral} value={`${lockedEth.toFixed(1)} ETH`} subValue={t.liquidity.backingEvents} />
        <StatsCard icon={<HiOutlineShieldCheck className="w-5 h-5" />} label={t.liquidity.overcollateralization} value={`${stats.overcollateralizationRatio / 10}%`} subValue={t.stats.guaranteeRatio} />
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{t.liquidity.evolution}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={mockLPHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2A5ADA" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2A5ADA" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(128,128,128,0.5)' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(128,128,128,0.5)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--surface-strong)', border: '1px solid var(--border-strong)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-primary)' }} />
            <Area type="monotone" dataKey="totalLiquidity" name="Total" stroke="#2A5ADA" strokeWidth={2} fill="url(#totalGrad)" />
            <Area type="monotone" dataKey="availableLiquidity" name={t.stats.available} stroke="#2DD4BF" strokeWidth={2} fill="url(#availGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{t.liquidity.deposit}</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1.5 block">{t.liquidity.amount}</label>
              <div className="relative">
                <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 pr-16 text-[var(--text-primary)] font-medium focus:border-[var(--accent)] focus:outline-none transition-colors" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-faint)] font-medium">ETH</span>
              </div>
            </div>
            <button onClick={handleDeposit} disabled={depositStatus !== 'idle' || !depositAmount} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${depositStatus === 'success' ? 'bg-green-500 text-white' : depositStatus === 'pending' ? 'bg-[var(--accent)]/50 text-[var(--bg-primary)] cursor-wait' : 'btn-primary'}`}>
              {depositStatus === 'idle' && t.liquidity.depositBtn}
              {depositStatus === 'pending' && t.liquidity.processing}
              {depositStatus === 'success' && t.liquidity.depositDone}
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{t.liquidity.withdraw}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs text-[var(--text-muted)]">{t.liquidity.amount}</label>
                <span className="text-xs text-[var(--text-faint)]">{t.stats.available}: {mockUserLPBalance} ETH</span>
              </div>
              <div className="relative">
                <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" max={mockUserLPBalance} className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 pr-16 text-[var(--text-primary)] font-medium focus:border-[var(--accent)] focus:outline-none transition-colors" />
                <button onClick={() => setWithdrawAmount(String(mockUserLPBalance))} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--accent)] hover:opacity-80 transition-colors">{t.liquidity.max}</button>
              </div>
            </div>
            <button onClick={handleWithdraw} disabled={withdrawStatus !== 'idle' || !withdrawAmount} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${withdrawStatus === 'success' ? 'bg-green-500 text-white' : withdrawStatus === 'pending' ? 'bg-[var(--accent)]/50 text-[var(--bg-primary)] cursor-wait' : 'btn-secondary'}`}>
              {withdrawStatus === 'idle' && t.liquidity.withdrawBtn}
              {withdrawStatus === 'pending' && t.liquidity.processing}
              {withdrawStatus === 'success' && t.liquidity.withdrawDone}
            </button>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{t.liquidity.yourPosition}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[var(--surface-input)] rounded-xl p-4 text-center">
            <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mb-1">{t.liquidity.deposited}</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{mockUserLPBalance} ETH</p>
          </div>
          <div className="bg-[var(--surface-input)] rounded-xl p-4 text-center">
            <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mb-1">{t.liquidity.yieldEarned}</p>
            <p className="text-xl font-bold text-[var(--accent)]">+{mockYield} ETH</p>
          </div>
          <div className="bg-[var(--surface-input)] rounded-xl p-4 text-center">
            <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mb-1">{t.liquidity.estApy}</p>
            <p className="text-xl font-bold text-[var(--accent)]">~12%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
