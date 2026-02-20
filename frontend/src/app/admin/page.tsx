'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { mockEvents } from '@/config/mockData';
import { MockClimateEvent } from '@/types';
import { HiOutlinePlus, HiOutlineCpuChip, HiOutlineCheck, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { parseEther } from 'viem';

export default function AdminPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [threshold, setThreshold] = useState('100');
  const [premium, setPremium] = useState('0.05');

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate chain interaction
    setTimeout(() => {
      const newEvent: MockClimateEvent = {
        id: `evt-${Date.now()}`,
        eventId: BigInt(Date.now()),
        name: name || 'Novo Evento Climático',
        region: region || 'Nova Região',
        state: 'PE',
        latitude: -8.0,
        longitude: -37.0,
        startTime: Math.floor(Date.now() / 1000) + 86400, // Starts tomorrow
        endTime: Math.floor(Date.now() / 1000) + (86400 * 30), // 30 days
        thresholdMm: Number(threshold),
        payoutPerToken: parseEther(premium) * 2n, // 2x premium roughly
        totalSupply: 100,
        availableTokens: 100,
        premiumPerToken: parseEther(premium),
        status: 'ACTIVE' as const,
      };

      // Update mock data in memory
      mockEvents.unshift(newEvent);

      setLoading(false);
      setNotification({ type: 'success', message: 'Evento criado com sucesso na rede de teste!' });

      // Reset form
      setName('');
      setRegion('');

      setTimeout(() => setNotification(null), 3000);
    }, 1500);
  };

  const handleSettle = (id: string, shouldTrigger: boolean) => {
    setLoading(true);
    setTimeout(() => {
      const evt = mockEvents.find(e => e.id === id);
      if (evt) {
        evt.status = 'SETTLED';
        evt.actualMm = shouldTrigger ? evt.thresholdMm - 20 : evt.thresholdMm + 20;
        evt.payoutTriggered = shouldTrigger;
      }
      setLoading(false);
      setNotification({ type: 'success', message: `Evento liquidado: ${shouldTrigger ? 'Pagamento Ativado' : 'Sem Pagamento'}` });
      setTimeout(() => setNotification(null), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Painel de Gerenciamento</h1>
          <p className="text-sm text-[var(--text-muted)]">Criação de eventos e simulação de oráculo</p>
        </div>
        <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs text-yellow-500 font-medium flex items-center gap-2">
          <HiOutlineExclamationTriangle /> Modo Admin (Testnet)
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <HiOutlineCheck className="w-5 h-5" />
          {notification.message}
        </div>
      )}

      {/* Create Event Form */}
      <div className="glass rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5 text-[var(--accent)]" /> Criar Novo Evento
        </h2>

        <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Nome do Evento</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Seca Sertão 2026/2"
              className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Região Alvo</label>
            <input
              type="text"
              value={region}
              onChange={e => setRegion(e.target.value)}
              placeholder="Ex: Araripina, PE"
              className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Limiar (mm)</label>
            <input
              type="number"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors"
              required
            />
            <p className="text-[10px] text-[var(--text-muted)]">Limite de chuva para acionar proteção</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Prêmio (ETH)</label>
            <input
              type="number"
              step="0.001"
              value={premium}
              onChange={e => setPremium(e.target.value)}
              className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors"
              required
            />
            <p className="text-[10px] text-[var(--text-muted)]">Custo para o usuário por token</p>
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold transition-all ${loading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'btn-primary'}`}
            >
              {loading ? 'Processando transação...' : 'Criar Evento na Blockchain'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Events & Settlement */}
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mt-10 mb-4 flex items-center gap-2">
        <HiOutlineCpuChip className="w-5 h-5 text-[var(--chainlink)]" /> Simular Oráculo (Settlement)
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {mockEvents.filter(e => e.status === 'ACTIVE').map(event => (
          <div key={event.id} className="glass p-5 rounded-xl flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">{event.name}</h3>
              <p className="text-xs text-[var(--text-muted)]">Limiar: &lt; {event.thresholdMm}mm • Tokens: {event.totalSupply}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSettle(event.id, true)}
                disabled={loading}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold transition-colors"
              >
                Forçar Seca (Trigger)
              </button>
              <button
                onClick={() => handleSettle(event.id, false)}
                disabled={loading}
                className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-semibold transition-colors"
              >
                Forçar Chuva (No Trigger)
              </button>
            </div>
          </div>
        ))}
        {mockEvents.filter(e => e.status === 'ACTIVE').length === 0 && (
          <p className="text-sm text-[var(--text-muted)] text-center py-8 bg-[var(--surface-input)] rounded-xl">Sem eventos ativos para liquidar.</p>
        )}
      </div>
    </div>
  );
}
