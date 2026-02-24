'use client';

import { useState, useEffect } from 'react';
import type { ClimateEvent } from '@/services/types';
import { useQuickBuy } from '@/hooks/useContractWrite';
import { formatEther } from 'viem';
import { HiOutlineXMark, HiOutlineShieldCheck } from 'react-icons/hi2';
import { useLanguage } from '@/i18n/LanguageContext';

interface BuyModalProps {
  event: ClimateEvent;
  isOpen: boolean;
  onClose: () => void;
}

export function BuyModal({ event, isOpen, onClose }: BuyModalProps) {
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const { buy, isPending, isConfirming, isSuccess, error, reset } = useQuickBuy();

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        reset();
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose, reset]);

  if (!isOpen) return null;

  const premiumPerToken = Number(formatEther(event.premiumPerToken));
  const payoutPerToken = Number(formatEther(event.payoutPerToken));
  const totalCost = premiumPerToken * quantity;
  const potentialPayout = payoutPerToken * quantity;
  const maxTokens = event.availableTokens;

  const status = isSuccess ? 'success' : (isPending || isConfirming) ? 'pending' : error ? 'error' : 'idle';

  const handleBuy = async () => {
    buy(event.eventId, quantity, event.premiumPerToken);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md glass-strong rounded-2xl p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-(--accent-glow) flex items-center justify-center">
              <HiOutlineShieldCheck className="w-5 h-5 text-(--accent)" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-(--text-primary)">{t.modal.title}</h3>
              <p className="text-xs text-(--text-muted)">{event.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-(--surface-hover) transition-colors">
            <HiOutlineXMark className="w-5 h-5 text-(--text-muted)" />
          </button>
        </div>

        <div className="bg-(--surface-input) rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-(--text-muted)">{t.modal.region}</span>
            <span className="text-(--text-secondary)">{event.region}, {event.state}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-(--text-muted)">{t.modal.threshold}</span>
            <span className="text-(--text-secondary)">&lt; {event.thresholdMm} mm</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-(--text-muted)">{t.modal.payoutPerToken}</span>
            <span className="text-(--accent) font-medium">{payoutPerToken.toFixed(3)} ETH</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-(--text-muted)">{t.modal.premiumPerToken}</span>
            <span className="text-(--text-secondary)">{premiumPerToken.toFixed(4)} ETH</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-(--text-muted)">{t.modal.available}</span>
            <span className="text-(--text-secondary)">{event.availableTokens} tokens</span>
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs text-(--text-muted) mb-2 block">{t.modal.quantity}</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl bg-(--surface-input) border border-(--border) text-(--text-primary) hover:border-(--border-strong) transition-colors flex items-center justify-center text-lg">−</button>
            <input type="number" value={quantity} onChange={(e) => setQuantity(Math.min(maxTokens, Math.max(1, parseInt(e.target.value) || 1)))} className="flex-1 h-10 bg-(--surface-input) border border-(--border) rounded-xl px-4 text-center text-(--text-primary) font-semibold text-lg focus:border-(--accent) focus:outline-none transition-colors" />
            <button onClick={() => setQuantity(Math.min(maxTokens, quantity + 1))} className="w-10 h-10 rounded-xl bg-(--surface-input) border border-(--border) text-(--text-primary) hover:border-(--border-strong) transition-colors flex items-center justify-center text-lg">+</button>
          </div>
          <button onClick={() => setQuantity(maxTokens)} className="text-[10px] text-(--accent) opacity-60 hover:opacity-100 mt-1.5 transition-colors">
            {t.modal.max} ({maxTokens})
          </button>
        </div>

        <div className="bg-linear-to-r from-(--accent-glow) to-[rgba(42,90,218,0.05)] rounded-xl p-4 mb-5 border border-(--border)">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-(--text-secondary)">{t.modal.totalCost}</span>
            <span className="text-(--text-primary) font-bold">{totalCost.toFixed(4)} ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-(--text-secondary)">{t.modal.potentialPayout}</span>
            <span className="text-(--accent) font-bold">{potentialPayout.toFixed(4)} ETH</span>
          </div>
          <div className="flex justify-between text-xs mt-2 pt-2 border-t border-(--border)">
            <span className="text-(--text-faint)">{t.modal.returnPotential}</span>
            <span className="text-(--accent) font-semibold">{totalCost > 0 ? ((potentialPayout / totalCost - 1) * 100).toFixed(0) : '0'}%</span>
          </div>
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error.message?.slice(0, 80)}</p>}

        <button onClick={handleBuy} disabled={status === 'pending' || status === 'success'} className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${status === 'success' ? 'bg-green-500 text-white' : status === 'pending' ? 'bg-(--accent)/50 text-(--bg-primary) cursor-wait' : 'btn-primary'}`}>
          {status === 'idle' && `${t.modal.buyTokens.replace('Token(s)', `${quantity} Token${quantity > 1 ? 's' : ''}`)}`}
          {status === 'pending' && (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t.modal.processing}
            </span>
          )}
          {status === 'success' && t.modal.success}
          {status === 'error' && t.modal.error}
        </button>
      </div>
    </div>
  );
}
