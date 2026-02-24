'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useClimateEvents } from '@/hooks/useClimateEvents';
import { useCreateEvent, useManualSettlement } from '@/hooks/useContractWrite';
import { useAdminRoles, useGrantRole, useRevokeRole, ROLES } from '@/hooks/useAdminRoles';
import { CONTRACTS } from '@/constants/contracts';
import { useAccount } from 'wagmi';
import {
  HiOutlinePlus, HiOutlineCpuChip, HiOutlineCheck, HiOutlineShieldCheck, HiOutlineUserPlus, HiOutlineUserMinus, HiOutlineLockClosed,
  HiOutlineSquares2X2, HiOutlineChartBar, HiOutlineBars3
} from 'react-icons/hi2';
import { RegionSearch } from '@/components/features/RegionSearch';
import type { GeoResult } from '@/components/features/RegionSearch';
import { formatEther } from 'viem';

type AdminTab = 'overview' | 'create' | 'settlement' | 'roles' | 'events';

export default function AdminPage() {
  const { t } = useLanguage();
  const { isConnected } = useAccount();
  const roles = useAdminRoles();
  const { events, isLoading: eventsLoading, refetch } = useClimateEvents();
  const { createEvent, isPending: createPending, isConfirming: createConfirming, isSuccess: createSuccess, error: createError, reset: resetCreate } = useCreateEvent();
  const { settle, isPending: settlePending, isConfirming: settleConfirming, isSuccess: settleSuccess, error: settleError, reset: resetSettle } = useManualSettlement();
  const { grant, isPending: grantPending, isConfirming: grantConfirming, isSuccess: grantSuccess, error: grantError, reset: resetGrant } = useGrantRole();
  const { revoke, isPending: revokePending, isConfirming: revokeConfirming, isSuccess: revokeSuccess, error: revokeError, reset: resetRevoke } = useRevokeRole();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Event Form State
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [latitude, setLatitude] = useState('-8.0');
  const [longitude, setLongitude] = useState('-37.0');
  const [threshold, setThreshold] = useState('100');
  const [payoutPerToken, setPayoutPerToken] = useState('0.1');
  const [tokensToCreate, setTokensToCreate] = useState('100');
  const [durationDays, setDurationDays] = useState('30');

  // Role Management State
  const [roleAddress, setRoleAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState<'EVENT_CREATOR' | 'SETTLEMENT_ADMIN' | 'PROTOCOL_ADMIN'>('EVENT_CREATOR');

  const loading = createPending || createConfirming || settlePending || settleConfirming;
  const roleLoading = grantPending || grantConfirming || revokePending || revokeConfirming;

  // Build sidebar menu based on user roles
  const sidebarItems = useMemo(() => {
    const items: { id: AdminTab; label: string; icon: React.ElementType; color: string }[] = [
      { id: 'overview', label: 'Overview', icon: HiOutlineSquares2X2, color: 'text-[var(--accent)]' },
    ];
    if (roles.isEventCreator || roles.isDefaultAdmin) {
      items.push({ id: 'create', label: t.admin.createEvent, icon: HiOutlinePlus, color: 'text-green-400' });
    }
    items.push({ id: 'events', label: t.nav.events, icon: HiOutlineChartBar, color: 'text-cyan-400' });
    if (roles.isSettlementAdmin || roles.isDefaultAdmin) {
      items.push({ id: 'settlement', label: 'Settlement', icon: HiOutlineCpuChip, color: 'text-[var(--chainlink)]' });
    }
    if (roles.isDefaultAdmin) {
      items.push({ id: 'roles', label: t.admin.roleManagement, icon: HiOutlineShieldCheck, color: 'text-red-400' });
    }
    return items;
  }, [roles, t]);

  // Notification effects
  useEffect(() => {
    if (createSuccess) {
      setNotification({ type: 'success', message: t.admin.eventCreated });
      setName(''); setRegion('');
      refetch();
      const timer = setTimeout(() => { setNotification(null); resetCreate(); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [createSuccess, refetch, resetCreate]);

  useEffect(() => {
    if (settleSuccess) {
      setNotification({ type: 'success', message: t.admin.settlementRequested });
      refetch();
      const timer = setTimeout(() => { setNotification(null); resetSettle(); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [settleSuccess, refetch, resetSettle]);

  useEffect(() => {
    if (grantSuccess) {
      setNotification({ type: 'success', message: t.admin.roleGranted });
      setRoleAddress('');
      roles.refetch();
      const timer = setTimeout(() => { setNotification(null); resetGrant(); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [grantSuccess, roles, resetGrant]);

  useEffect(() => {
    if (revokeSuccess) {
      setNotification({ type: 'success', message: t.admin.roleRevoked });
      setRoleAddress('');
      roles.refetch();
      const timer = setTimeout(() => { setNotification(null); resetRevoke(); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [revokeSuccess, roles, resetRevoke]);

  useEffect(() => {
    const err = createError || settleError || grantError || revokeError;
    if (err) {
      setNotification({ type: 'error', message: err.message?.slice(0, 120) || t.admin.txFailed });
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [createError, settleError, grantError, revokeError]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = Math.floor(Date.now() / 1000) + 3600;
    const endTime = startTime + (Number(durationDays) * 86400);
    createEvent({
      latitude: Number(latitude),
      longitude: Number(longitude),
      startTime, endTime,
      thresholdMm: Number(threshold),
      payoutPerToken,
      tokensToCreate: Number(tokensToCreate),
    });
  };

  const handleSettle = (eventId: bigint) => { settle(eventId); };

  const getRoleConfig = () => {
    switch (selectedRole) {
      case 'EVENT_CREATOR':
        return { contract: CONTRACTS.FACTORY, role: ROLES.EVENT_CREATOR, label: 'Event Creator', description: 'Can create new climate events' };
      case 'SETTLEMENT_ADMIN':
        return { contract: CONTRACTS.SETTLEMENT, role: ROLES.DEFAULT_ADMIN, label: 'Settlement Admin', description: 'Can trigger manual settlement and manage the engine' };
      case 'PROTOCOL_ADMIN':
        return { contract: CONTRACTS.PROTOCOL, role: ROLES.PROTOCOL_ADMIN, label: 'Protocol Admin', description: 'Can pause the protocol and manage global settings' };
    }
  };

  const handleGrantRole = () => {
    if (!roleAddress || !roleAddress.startsWith('0x') || roleAddress.length !== 42) return;
    const cfg = getRoleConfig();
    grant(cfg.contract, cfg.role, roleAddress as `0x${string}`);
  };

  const handleRevokeRole = () => {
    if (!roleAddress || !roleAddress.startsWith('0x') || roleAddress.length !== 42) return;
    const cfg = getRoleConfig();
    revoke(cfg.contract, cfg.role, roleAddress as `0x${string}`);
  };

  const activeEvents = events.filter(e => e.status === 'ACTIVE');
  const settledEvents = events.filter(e => e.status === 'SETTLED');

  // ─── Access Control Gate ───
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <HiOutlineLockClosed className="w-12 h-12 text-[var(--text-faint)]" />
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.admin.title}</h1>
        <p className="text-sm text-[var(--text-muted)] max-w-md">{t.admin.connectWallet}</p>
      </div>
    );
  }

  if (roles.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">{t.admin.checkingPermissions}</p>
          <p className="text-[10px] text-[var(--text-faint)] mt-2">Querying Sepolia contracts...</p>
        </div>
      </div>
    );
  }

  if (!roles.isAnyAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <HiOutlineShieldCheck className="w-12 h-12 text-red-400" />
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.admin.accessDenied}</h1>
        <p className="text-sm text-[var(--text-muted)] max-w-md">{t.admin.noRole}</p>
        <div className="glass rounded-xl p-4 mt-2 text-xs text-[var(--text-faint)] font-mono break-all">
          {roles.address}
        </div>
        <button onClick={() => roles.refetch()} className="btn-primary text-xs px-4 py-2 mt-2">Retry Check</button>
        <p className="text-[10px] text-[var(--text-faint)] max-w-xs">
          If you are the deployer, the RPC may be slow. Try switching to a faster RPC or retrying.
        </p>
      </div>
    );
  }

  // ─── Tab Content Renderers ───

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mb-1">Total Events</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{events.length}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mb-1">{t.events.active}</p>
          <p className="text-2xl font-bold text-green-400">{activeEvents.length}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mb-1">{t.events.settled}</p>
          <p className="text-2xl font-bold text-blue-400">{settledEvents.length}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mb-1">Payout Triggered</p>
          <p className="text-2xl font-bold text-[var(--accent)]">{events.filter(e => e.payoutTriggered).length}</p>
        </div>
      </div>

      {/* Your Roles */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Your Roles</h3>
        <div className="flex flex-wrap gap-2">
          {roles.isDefaultAdmin && <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">DEFAULT ADMIN</span>}
          {roles.isProtocolAdmin && <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">PROTOCOL ADMIN</span>}
          {roles.isEventCreator && <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">EVENT CREATOR</span>}
          {roles.isSettlementAdmin && <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">SETTLEMENT ADMIN</span>}
        </div>
        <p className="text-[10px] text-[var(--text-faint)] font-mono mt-3 break-all">{roles.address}</p>
      </div>

      {/* Recent Active Events */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Active Events</h3>
          <button onClick={() => setActiveTab('events')} className="text-xs text-[var(--accent)] hover:underline">View all</button>
        </div>
        {eventsLoading ? (
          <div className="py-6 text-center">
            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          </div>
        ) : activeEvents.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-4">No active events</p>
        ) : (
          <div className="space-y-2">
            {activeEvents.slice(0, 5).map(event => (
              <div key={event.id} className="flex items-center justify-between bg-[var(--surface-input)] rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{event.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{event.region} &bull; &lt;{event.thresholdMm}mm</p>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />{t.events.active}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateEvent = () => (
    <div className="glass rounded-2xl p-6 md:p-8">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
        <HiOutlinePlus className="w-5 h-5 text-[var(--accent)]" /> {t.admin.createEvent}
      </h2>

      <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">{t.admin.eventName}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.admin.eventNamePlaceholder} className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors" required />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">{t.admin.targetRegion}</label>
          <RegionSearch
            value={region}
            onChange={setRegion}
            onSelect={(geo: GeoResult) => {
              setLatitude(geo.lat.toFixed(4));
              setLongitude(geo.lon.toFixed(4));
            }}
            placeholder={t.admin.regionPlaceholder}
          />
          <p className="text-[10px] text-[var(--text-muted)]">Type a city name to search. Coordinates will be filled automatically.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Latitude</label>
            <input type="number" step="0.0001" value={latitude} onChange={e => setLatitude(e.target.value)} className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors font-mono text-sm" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Longitude</label>
            <input type="number" step="0.0001" value={longitude} onChange={e => setLongitude(e.target.value)} className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors font-mono text-sm" required />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">{t.admin.thresholdMm}</label>
          <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors" required />
          <p className="text-[10px] text-[var(--text-muted)]">{t.admin.thresholdHint}</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">{t.admin.payoutPerToken}</label>
          <input type="number" step="0.001" value={payoutPerToken} onChange={e => setPayoutPerToken(e.target.value)} className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors" required />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">{t.admin.tokensToCreate}</label>
          <input type="number" value={tokensToCreate} onChange={e => setTokensToCreate(e.target.value)} className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors" required />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">{t.admin.durationDays}</label>
          <input type="number" value={durationDays} onChange={e => setDurationDays(e.target.value)} className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors" required />
        </div>
        <div className="md:col-span-2 pt-2">
          <button type="submit" disabled={loading} className={`w-full py-4 rounded-xl font-bold transition-all ${loading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'btn-primary'}`}>
            {loading ? t.admin.processing : t.admin.createBtn}
          </button>
        </div>
      </form>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <HiOutlineChartBar className="w-5 h-5 text-cyan-400" /> All Events ({events.length})
        </h2>
      </div>
      {eventsLoading ? (
        <div className="glass p-8 rounded-xl text-center">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-[var(--text-muted)]">{t.admin.loadingEvents}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center">
          <HiOutlineChartBar className="w-10 h-10 text-[var(--text-faint)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">No events created yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => {
            const statusColors: Record<string, string> = {
              ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
              SETTLED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
              EXPIRED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
            };
            return (
              <div key={event.id} className="glass rounded-xl p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">{event.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{event.region}, {event.state}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[event.status] || statusColors.EXPIRED}`}>
                      {event.status}
                    </span>
                    {event.payoutTriggered && (
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/20">PAYOUT</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                  <div className="bg-[var(--surface-input)] rounded-lg py-2 px-3">
                    <p className="text-[9px] text-[var(--text-faint)] uppercase">Threshold</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{event.thresholdMm}mm</p>
                  </div>
                  <div className="bg-[var(--surface-input)] rounded-lg py-2 px-3">
                    <p className="text-[9px] text-[var(--text-faint)] uppercase">Actual</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{event.actualMm ?? '—'}mm</p>
                  </div>
                  <div className="bg-[var(--surface-input)] rounded-lg py-2 px-3">
                    <p className="text-[9px] text-[var(--text-faint)] uppercase">Supply</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{event.totalSupply}</p>
                  </div>
                  <div className="bg-[var(--surface-input)] rounded-lg py-2 px-3">
                    <p className="text-[9px] text-[var(--text-faint)] uppercase">Available</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{event.availableTokens}</p>
                  </div>
                  <div className="bg-[var(--surface-input)] rounded-lg py-2 px-3">
                    <p className="text-[9px] text-[var(--text-faint)] uppercase">Payout/Token</p>
                    <p className="text-sm font-bold text-[var(--accent)]">{Number(formatEther(event.payoutPerToken)).toFixed(3)} ETH</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSettlement = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <HiOutlineCpuChip className="w-5 h-5 text-[var(--chainlink)]" /> {t.admin.manualSettlement}
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {eventsLoading ? (
          <div className="glass p-8 rounded-xl text-center">
            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-[var(--text-muted)]">{t.admin.loadingEvents}</p>
          </div>
        ) : activeEvents.length === 0 ? (
          <div className="glass rounded-xl p-10 text-center">
            <HiOutlineCpuChip className="w-10 h-10 text-[var(--text-faint)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">{t.admin.noActiveEvents}</p>
            <p className="text-xs text-[var(--text-faint)] mt-1">Create an event first to trigger settlement.</p>
          </div>
        ) : (
          activeEvents.map(event => (
            <div key={event.id} className="glass p-5 rounded-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{event.name}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{event.region} &bull; Threshold: &lt; {event.thresholdMm}mm &bull; Tokens: {event.totalSupply}</p>
                  <p className="text-[10px] text-[var(--text-faint)] mt-1">
                    {new Date(event.startTime * 1000).toLocaleDateString('en-US')} — {new Date(event.endTime * 1000).toLocaleDateString('en-US')}
                  </p>
                </div>
                <button
                  onClick={() => handleSettle(event.eventId)}
                  disabled={loading}
                  className="px-5 py-2.5 bg-[var(--chainlink)]/10 hover:bg-[var(--chainlink)]/20 text-[var(--chainlink)] border border-[var(--chainlink)]/20 rounded-xl text-xs font-semibold transition-colors flex-shrink-0"
                >
                  {(settlePending || settleConfirming) ? t.admin.processing : t.admin.requestSettlement}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderRoles = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <HiOutlineShieldCheck className="w-5 h-5 text-[var(--accent)]" /> {t.admin.roleManagement}
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          As <span className="text-red-400 font-semibold">Default Admin</span>, {t.admin.roleManagementDesc}
        </p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">{t.admin.walletAddress}</label>
            <input
              type="text"
              value={roleAddress}
              onChange={e => setRoleAddress(e.target.value)}
              placeholder="0x..."
              className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] font-mono text-sm focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">{t.admin.role}</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as typeof selectedRole)}
              className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl px-4 text-[var(--text-primary)] text-sm focus:border-[var(--accent)] outline-none transition-colors"
            >
              <option value="EVENT_CREATOR">Event Creator (Factory)</option>
              <option value="SETTLEMENT_ADMIN">Settlement Admin (Engine)</option>
              <option value="PROTOCOL_ADMIN">Protocol Admin (ClimProtocol)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold">{t.admin.action}</label>
            <div className="flex gap-3">
              <button
                onClick={handleGrantRole}
                disabled={roleLoading || !roleAddress}
                className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-xl text-sm font-semibold transition-all bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HiOutlineUserPlus className="w-4 h-4" />
                {(grantPending || grantConfirming) ? t.admin.granting : t.admin.grant}
              </button>
              <button
                onClick={handleRevokeRole}
                disabled={roleLoading || !roleAddress}
                className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-xl text-sm font-semibold transition-all bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HiOutlineUserMinus className="w-4 h-4" />
                {(revokePending || revokeConfirming) ? t.admin.revoking : t.admin.revoke}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface-input)] rounded-xl p-4 text-xs text-[var(--text-muted)] space-y-1">
          <p className="font-semibold text-[var(--text-secondary)] mb-2">{t.admin.roleDescriptions}</p>
          <p><span className="text-green-400 font-medium">Event Creator</span> — {t.admin.eventCreatorDesc}</p>
          <p><span className="text-blue-400 font-medium">Settlement Admin</span> — {t.admin.settlementAdminDesc}</p>
          <p><span className="text-purple-400 font-medium">Protocol Admin</span> — {t.admin.protocolAdminDesc}</p>
        </div>
      </div>
    </div>
  );

  const tabRenderers: Record<AdminTab, () => React.ReactNode> = {
    overview: renderOverview,
    create: renderCreateEvent,
    events: renderEvents,
    settlement: renderSettlement,
    roles: renderRoles,
  };

  // ─── Admin Dashboard with Sidebar ───
  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 right-6 z-50 md:hidden w-12 h-12 rounded-full bg-[var(--accent)] text-[var(--bg-primary)] flex items-center justify-center shadow-lg"
      >
        <HiOutlineBars3 className="w-6 h-6" />
      </button>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 md:top-16 left-0 z-40 md:z-auto
        h-full md:h-[calc(100vh-4rem)]
        w-64 md:w-56 lg:w-64
        bg-[var(--bg-secondary)] md:bg-transparent
        border-r border-[var(--border)] md:border-r-0
        flex flex-col gap-1 p-4 md:pr-6 md:pl-0 pt-6
        overflow-y-auto
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="mb-5 px-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center">
              <HiOutlineShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">{t.admin.title}</h2>
              <p className="text-[9px] text-[var(--text-faint)]">{t.admin.adminMode}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col gap-1">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 text-left w-full
                  ${isActive
                    ? 'bg-[var(--accent-glow)] text-[var(--accent)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  }
                `}
              >
                <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-[var(--accent)]' : item.color}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-4 px-3 border-t border-[var(--border)]">
          <div className="flex flex-wrap gap-1 mb-2">
            {roles.isDefaultAdmin && <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">ADMIN</span>}
            {roles.isEventCreator && <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">CREATOR</span>}
            {roles.isSettlementAdmin && <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">SETTLE</span>}
          </div>
          <p className="text-[9px] text-[var(--text-faint)] font-mono truncate">{roles.address}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 px-2 md:px-6 py-6">
        {/* Top bar with notification */}
        {notification && (
          <div className={`p-3 rounded-xl border flex items-center gap-3 mb-6 animate-fade-in ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <HiOutlineCheck className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{notification.message}</span>
          </div>
        )}

        {/* Tab Content */}
        {tabRenderers[activeTab]?.() ?? renderOverview()}
      </main>
    </div>
  );
}
