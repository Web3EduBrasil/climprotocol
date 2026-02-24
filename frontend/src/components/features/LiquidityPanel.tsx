'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useProtocolStats } from '@/hooks/useProtocolStats';
import { useLPBalance } from '@/hooks/useLPBalance';
import { useProvideLiquidity, useWithdrawLiquidity } from '@/hooks/useContractWrite';
import { StatsCard } from '@/components/ui/StatsCard';
import { formatEther } from 'viem';
import { HiOutlineBanknotes, HiOutlineLockClosed, HiOutlineArrowTrendingUp, HiOutlineShieldCheck } from 'react-icons/hi2';

export function LiquidityPanel() {
  const { t } = useLanguage();
  const { stats, isLoading: statsLoading } = useProtocolStats();
  const { balance: lpBalance, isConnected } = useLPBalance();
  const { deposit, isPending: depositPending, isConfirming: depositConfirming, isSuccess: depositSuccess, error: depositError, reset: resetDeposit } = useProvideLiquidity();
  const { withdraw, isPending: withdrawPending, isConfirming: withdrawConfirming, isSuccess: withdrawSuccess, error: withdrawError, reset: resetWithdraw } = useWithdrawLiquidity();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const totalEth = stats ? Number(formatEther(stats.totalLiquidity)) : 0;
  const availableEth = stats ? Number(formatEther(stats.availableLiquidity)) : 0;
  const lockedEth = stats ? Number(formatEther(stats.lockedCollateral)) : 0;
  const userLPBalance = Number(formatEther(lpBalance));

  useEffect(() => {
    if (depositSuccess) {
      const timer = setTimeout(() => {
        setDepositAmount('');
        resetDeposit();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [depositSuccess, resetDeposit]);

  useEffect(() => {
    if (withdrawSuccess) {
      const timer = setTimeout(() => {
        setWithdrawAmount('');
        resetWithdraw();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [withdrawSuccess, resetWithdraw]);

  const handleDeposit = () => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    deposit(depositAmount);
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > userLPBalance) return;
    withdraw(withdrawAmount);
  };

  const depositStatus = depositSuccess ? 'success' : (depositPending || depositConfirming) ? 'pending' : 'idle';
  const withdrawStatus = withdrawSuccess ? 'success' : (withdrawPending || withdrawConfirming) ? 'pending' : 'idle';

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-(--accent) border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-(--text-muted)">Loading pool data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-(--text-primary) mb-4 flex items-center gap-2">
        <HiOutlineBanknotes className="w-5 h-5 text-(--accent)" /> {t.liquidity.title}
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<HiOutlineBanknotes className="w-5 h-5" />} label={t.stats.totalLiquidity} value={`${totalEth.toFixed(1)} ETH`} trend="up" />
        <StatsCard icon={<HiOutlineArrowTrendingUp className="w-5 h-5" />} label={t.stats.available} value={`${availableEth.toFixed(1)} ETH`} subValue={totalEth > 0 ? `${((availableEth / totalEth) * 100).toFixed(0)}% ${t.stats.ofTotal}` : '0%'} trend="neutral" />
        <StatsCard icon={<HiOutlineLockClosed className="w-5 h-5" />} label={t.liquidity.lockedCollateral} value={`${lockedEth.toFixed(1)} ETH`} subValue={t.liquidity.backingEvents} />
        <StatsCard icon={<HiOutlineShieldCheck className="w-5 h-5" />} label={t.liquidity.overcollateralization} value={`${(stats?.overcollateralizationRatio ?? 0) / 10}%`} subValue={t.stats.guaranteeRatio} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deposit */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-(--text-primary) mb-4">{t.liquidity.deposit}</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-(--text-muted) mb-1.5 block">{t.liquidity.amount}</label>
              <div className="relative">
                <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" className="w-full h-12 bg-(--surface-input) border border-(--border) rounded-xl px-4 pr-16 text-(--text-primary) font-medium focus:border-(--accent) focus:outline-none transition-colors" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-(--text-faint) font-medium">ETH</span>
              </div>
            </div>
            {depositError && <p className="text-xs text-red-400">{depositError.message?.slice(0, 80)}</p>}
            <button onClick={handleDeposit} disabled={depositStatus !== 'idle' || !depositAmount} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${depositStatus === 'success' ? 'bg-green-500 text-white' : depositStatus === 'pending' ? 'bg-(--accent)/50 text-(--bg-primary) cursor-wait' : 'btn-primary'}`}>
              {depositStatus === 'idle' && t.liquidity.depositBtn}
              {depositStatus === 'pending' && t.liquidity.processing}
              {depositStatus === 'success' && t.liquidity.depositDone}
            </button>
          </div>
        </div>

        {/* Withdraw */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-(--text-primary) mb-4">{t.liquidity.withdraw}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs text-(--text-muted)">{t.liquidity.amount}</label>
                <span className="text-xs text-(--text-faint)">{t.stats.available}: {userLPBalance.toFixed(4)} ETH</span>
              </div>
              <div className="relative">
                <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" max={userLPBalance} className="w-full h-12 bg-(--surface-input) border border-(--border) rounded-xl px-4 pr-16 text-(--text-primary) font-medium focus:border-(--accent) focus:outline-none transition-colors" />
                <button onClick={() => setWithdrawAmount(userLPBalance.toString())} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-(--accent) hover:opacity-80 transition-colors">{t.liquidity.max}</button>
              </div>
            </div>
            {withdrawError && <p className="text-xs text-red-400">{withdrawError.message?.slice(0, 80)}</p>}
            <button onClick={handleWithdraw} disabled={withdrawStatus !== 'idle' || !withdrawAmount} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${withdrawStatus === 'success' ? 'bg-green-500 text-white' : withdrawStatus === 'pending' ? 'bg-(--accent)/50 text-(--bg-primary) cursor-wait' : 'btn-secondary'}`}>
              {withdrawStatus === 'idle' && t.liquidity.withdrawBtn}
              {withdrawStatus === 'pending' && t.liquidity.processing}
              {withdrawStatus === 'success' && t.liquidity.withdrawDone}
            </button>
          </div>
        </div>
      </div>

      {/* User Position */}
      {isConnected && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-(--text-primary) mb-4">{t.liquidity.yourPosition}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-(--surface-input) rounded-xl p-4 text-center">
              <p className="text-[10px] text-(--text-faint) uppercase tracking-wider mb-1">{t.liquidity.deposited}</p>
              <p className="text-xl font-bold text-(--text-primary)">{userLPBalance.toFixed(4)} ETH</p>
            </div>
            <div className="bg-(--surface-input) rounded-xl p-4 text-center">
              <p className="text-[10px] text-(--text-faint) uppercase tracking-wider mb-1">{t.liquidity.poolShare}</p>
              <p className="text-xl font-bold text-(--accent)">{totalEth > 0 ? ((userLPBalance / totalEth) * 100).toFixed(2) : '0'}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
