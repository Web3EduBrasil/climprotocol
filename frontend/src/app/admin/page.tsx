'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useClimateEvents } from '@/hooks/useClimateEvents';
import { useCreateEvent, useManualSettlement } from '@/hooks/useContractWrite';
import { useAdminRoles, useGrantRole, useRevokeRole, ROLES } from '@/hooks/useAdminRoles';
import { useSystemPermissions } from '@/hooks/useSystemPermissions';
import { CONTRACTS } from '@/constants/contracts';
import { useAccount } from 'wagmi';
import { useProtocolStats } from '@/hooks/useProtocolStats';
import { formatEther } from 'viem';
import { parseContractError, etherscanTxUrl } from '@/utils/parseContractError';
import {
  HiOutlinePlus, HiOutlineCpuChip, HiOutlineCheck, HiOutlineShieldCheck, HiOutlineUserPlus, HiOutlineUserMinus, HiOutlineLockClosed,
  HiOutlineSquares2X2, HiOutlineChartBar, HiOutlineBars3, HiOutlineBanknotes, HiOutlineXMark, HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import { LiquidityPanel } from '@/components/features/LiquidityPanel';
import { RegionSearch } from '@/components/features/RegionSearch';
import type { GeoResult } from '@/components/features/RegionSearch';

type AdminTab = 'overview' | 'create' | 'settlement' | 'roles' | 'events' | 'liquidity';

export default function AdminPage() {
  const { t } = useLanguage();
  const { isConnected } = useAccount();
  const roles = useAdminRoles();
  const { events, isLoading: eventsLoading, refetch } = useClimateEvents();
  const { stats } = useProtocolStats();
  const { createEvent, hash: createHash, isPending: createPending, isConfirming: createConfirming, isSuccess: createSuccess, isReverted: createReverted, error: createError, reset: resetCreate } = useCreateEvent();
  const { settle, hash: settleHash, isPending: settlePending, isConfirming: settleConfirming, isSuccess: settleSuccess, isReverted: settleReverted, error: settleError, reset: resetSettle } = useManualSettlement();
  const { grant, hash: grantHash, isPending: grantPending, isConfirming: grantConfirming, isSuccess: grantSuccess, error: grantError, reset: resetGrant } = useGrantRole();
  const { revoke, hash: revokeHash, isPending: revokePending, isConfirming: revokeConfirming, isSuccess: revokeSuccess, error: revokeError, reset: resetRevoke } = useRevokeRole();
  const sysPerms = useSystemPermissions();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'pending' | 'confirming'; message: string; detail?: string; hash?: string } | null>(null);
  const confirmStartRef = useRef<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const prevConfirmingRef = useRef(false);

  // Event Form State
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [latitude, setLatitude] = useState('-8.0');
  const [longitude, setLongitude] = useState('-37.0');
  const [threshold, setThreshold] = useState('100');
  const [payoutPerToken, setPayoutPerToken] = useState('0.001');
  const [tokensToCreate, setTokensToCreate] = useState('10');
  const [durationDays, setDurationDays] = useState('30');

  // Role Management State
  const [roleAddress, setRoleAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState<'EVENT_CREATOR' | 'SETTLEMENT_ADMIN' | 'PROTOCOL_ADMIN'>('EVENT_CREATOR');

  const loading = createPending || createConfirming || settlePending || settleConfirming;
  const roleLoading = grantPending || grantConfirming || revokePending || revokeConfirming;

  // Build sidebar menu based on user roles
  const sidebarItems = useMemo(() => {
    const items: { id: AdminTab; label: string; icon: React.ElementType; color: string }[] = [
      { id: 'overview', label: 'Overview', icon: HiOutlineSquares2X2, color: 'text-(--accent)' },
    ];
    if (roles.isEventCreator || roles.isDefaultAdmin) {
      items.push({ id: 'create', label: t.admin.createEvent, icon: HiOutlinePlus, color: 'text-green-400' });
    }
    items.push({ id: 'events', label: t.nav.events, icon: HiOutlineChartBar, color: 'text-cyan-400' });
    items.push({ id: 'liquidity', label: t.nav.liquidity, icon: HiOutlineBanknotes, color: 'text-emerald-400' });
    if (roles.isSettlementAdmin || roles.isDefaultAdmin) {
      items.push({ id: 'settlement', label: 'Settlement', icon: HiOutlineCpuChip, color: 'text-(--chainlink)' });
    }
    if (roles.isDefaultAdmin) {
      items.push({ id: 'roles', label: t.admin.roleManagement, icon: HiOutlineShieldCheck, color: 'text-red-400' });
    }
    return items;
  }, [roles, t]);

  // ─── Elapsed timer for confirming state ───
  const isAnyConfirming = createConfirming || settleConfirming || grantConfirming || revokeConfirming;

  useEffect(() => {
    if (isAnyConfirming) {
      if (!confirmStartRef.current) confirmStartRef.current = Date.now();
      const iv = setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - (confirmStartRef.current || Date.now())) / 1000));
      }, 1000);
      return () => {
        clearInterval(iv);
      };
    } else {
      confirmStartRef.current = null;
    }
  }, [isAnyConfirming]);

  // Reset elapsed when confirming ends (outside effect to avoid cascading render)
  if (!isAnyConfirming && elapsedSec !== 0) {
    setElapsedSec(0);
  }

  // ─── Live transaction status (pending/confirming) ───
  useEffect(() => {
    if (createPending || settlePending || grantPending || revokePending) {
      setTimeout(() => setNotification({ type: 'pending', message: 'Confirm the transaction in your wallet...' }), 0);
    }
  }, [createPending, settlePending, grantPending, revokePending]);

  useEffect(() => {
    const isConfirmingNow = createConfirming || settleConfirming || grantConfirming || revokeConfirming;
    if (isConfirmingNow) {
      prevConfirmingRef.current = true;
      const txHash = createHash || settleHash || grantHash || revokeHash;
      setTimeout(() => setNotification({ type: 'confirming', message: 'Transaction sent! Waiting for blockchain confirmation...', hash: txHash }), 0);
    } else if (prevConfirmingRef.current) {
      // Confirming just ended — check if we have a result, if not show fallback
      prevConfirmingRef.current = false;
      const hasResult = createSuccess || createReverted || settleSuccess || settleReverted || grantSuccess || revokeSuccess || createError || settleError || grantError || revokeError;
      if (!hasResult) {
        setTimeout(() => setNotification({ type: 'error', message: 'Transaction status unknown. Check your wallet or Etherscan for the result.', hash: createHash || settleHash || grantHash || revokeHash }), 0);
        const auto = setTimeout(() => setNotification(null), 15000);
        return () => clearTimeout(auto);
      }
    }
  }, [createConfirming, settleConfirming, grantConfirming, revokeConfirming, createHash, settleHash, grantHash, revokeHash, createSuccess, createReverted, settleSuccess, settleReverted, grantSuccess, revokeSuccess, createError, settleError, grantError, revokeError]);

  // Notification effects — defer setState to avoid cascading renders
  useEffect(() => {
    if (createSuccess) {
      const timer = setTimeout(() => {
        setNotification({ type: 'success', message: t.admin.eventCreated });
        setName(''); setRegion('');
        refetch();
      }, 0);
      const reset = setTimeout(() => { setNotification(null); resetCreate(); }, 5000);
      return () => { clearTimeout(timer); clearTimeout(reset); };
    }
  }, [createSuccess, refetch, resetCreate, t]);

  useEffect(() => {
    if (settleSuccess) {
      const timer = setTimeout(() => {
        setNotification({ type: 'success', message: t.admin.settlementRequested });
        refetch();
      }, 0);
      const reset = setTimeout(() => { setNotification(null); resetSettle(); }, 5000);
      return () => { clearTimeout(timer); clearTimeout(reset); };
    }
  }, [settleSuccess, refetch, resetSettle, t]);

  useEffect(() => {
    if (grantSuccess) {
      const timer = setTimeout(() => {
        setNotification({ type: 'success', message: t.admin.roleGranted });
        setRoleAddress('');
        roles.refetch();
      }, 0);
      const reset = setTimeout(() => { setNotification(null); resetGrant(); }, 5000);
      return () => { clearTimeout(timer); clearTimeout(reset); };
    }
  }, [grantSuccess, roles, resetGrant, t]);

  useEffect(() => {
    if (revokeSuccess) {
      const timer = setTimeout(() => {
        setNotification({ type: 'success', message: t.admin.roleRevoked });
        setRoleAddress('');
        roles.refetch();
      }, 0);
      const reset = setTimeout(() => { setNotification(null); resetRevoke(); }, 5000);
      return () => { clearTimeout(timer); clearTimeout(reset); };
    }
  }, [revokeSuccess, roles, resetRevoke, t]);

  useEffect(() => {
    const err = createError || settleError || grantError || revokeError;
    if (err) {
      const parsed = parseContractError(err);
      const timer = setTimeout(() => {
        setNotification({ type: 'error', message: parsed, detail: err.message?.slice(0, 300) });
      }, 0);
      const reset = setTimeout(() => setNotification(null), 15000);
      return () => { clearTimeout(timer); clearTimeout(reset); };
    }
  }, [createError, settleError, grantError, revokeError, t]);

  // ─── Detect on-chain reverts (tx mined but failed) ───
  useEffect(() => {
    if (createReverted) {
      const timer = setTimeout(() => {
        setNotification({
          type: 'error',
          message: 'Transaction reverted on-chain. Likely cause: insufficient liquidity or invalid parameters.',
          detail: 'The transaction was mined but reverted. Check pool liquidity, event duration (min 1 day), and startTime requirements.',
          hash: createHash,
        });
      }, 0);
      const auto = setTimeout(() => { setNotification(null); resetCreate(); }, 20000);
      return () => { clearTimeout(timer); clearTimeout(auto); };
    }
  }, [createReverted, createHash, resetCreate]);

  useEffect(() => {
    if (settleReverted) {
      const timer = setTimeout(() => {
        setNotification({
          type: 'error',
          message: 'Settlement transaction reverted on-chain. The event may have already been settled or conditions not met.',
          hash: settleHash,
        });
      }, 0);
      const auto = setTimeout(() => { setNotification(null); resetSettle(); }, 15000);
      return () => { clearTimeout(timer); clearTimeout(auto); };
    }
  }, [settleReverted, settleHash, resetSettle]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    // Contract requires startTime > block.timestamp + 1 hour (strictly greater)
    // Add 2-hour buffer to avoid boundary failures on slow blocks
    const startTime = Math.floor(Date.now() / 1000) + 7200;
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
        <HiOutlineLockClosed className="w-12 h-12 text-(--text-faint)" />
        <h1 className="text-2xl font-bold text-(--text-primary)">{t.admin.title}</h1>
        <p className="text-sm text-(--text-muted) max-w-md">{t.admin.connectWallet}</p>
      </div>
    );
  }

  if (roles.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-(--accent) border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-(--text-muted)">{t.admin.checkingPermissions}</p>
          <p className="text-[10px] text-(--text-faint) mt-2">Querying Sepolia contracts...</p>
        </div>
      </div>
    );
  }

  if (!roles.isAnyAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <HiOutlineShieldCheck className="w-12 h-12 text-red-400" />
        <h1 className="text-2xl font-bold text-(--text-primary)">{t.admin.accessDenied}</h1>
        <p className="text-sm text-(--text-muted) max-w-md">{t.admin.noRole}</p>
        <div className="glass rounded-xl p-4 mt-2 text-xs text-(--text-faint) font-mono break-all">
          {roles.address}
        </div>
        <button onClick={() => roles.refetch()} className="btn-primary text-xs px-4 py-2 mt-2">Retry Check</button>
        <p className="text-[10px] text-(--text-faint) max-w-xs">
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
          <p className="text-[10px] text-(--text-faint) uppercase tracking-wider mb-1">Total Events</p>
          <p className="text-2xl font-bold text-(--text-primary)">{events.length}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-[10px] text-(--text-faint) uppercase tracking-wider mb-1">{t.events.active}</p>
          <p className="text-2xl font-bold text-green-400">{activeEvents.length}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-[10px] text-(--text-faint) uppercase tracking-wider mb-1">{t.events.settled}</p>
          <p className="text-2xl font-bold text-blue-400">{settledEvents.length}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-[10px] text-(--text-faint) uppercase tracking-wider mb-1">Payout Triggered</p>
          <p className="text-2xl font-bold text-(--accent)">{events.filter(e => e.payoutTriggered).length}</p>
        </div>
      </div>

      {/* Your Roles */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-(--text-primary) mb-3">Your Roles</h3>
        <div className="flex flex-wrap gap-2">
          {roles.isDefaultAdmin && <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">DEFAULT ADMIN</span>}
          {roles.isProtocolAdmin && <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">PROTOCOL ADMIN</span>}
          {roles.isEventCreator && <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">EVENT CREATOR</span>}
          {roles.isSettlementAdmin && <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">SETTLEMENT ADMIN</span>}
        </div>
        <p className="text-[10px] text-(--text-faint) font-mono mt-3 break-all">{roles.address}</p>
      </div>

      {/* System Permissions Check */}
      {roles.isDefaultAdmin && !sysPerms.isLoading && (
        <div className={`glass rounded-xl p-5 border ${sysPerms.allCriticalSet ? 'border-green-500/20' : 'border-red-500/30'}`}>
          <h3 className={`text-sm font-semibold mb-1 flex items-center gap-2 ${sysPerms.allCriticalSet ? 'text-green-400' : 'text-red-400'}`}>
            {sysPerms.allCriticalSet
              ? <><HiOutlineCheck className="w-4 h-4" /> Contract Permissions — All OK</>
              : <><HiOutlineExclamationTriangle className="w-4 h-4" /> Contract Permissions Missing</>
            }
          </h3>
          <p className="text-[10px] text-(--text-muted) mb-4">
            {sysPerms.allCriticalSet
              ? 'All inter-contract roles are properly configured. The protocol is ready to create events.'
              : 'The protocol contracts are missing required inter-contract roles. Events cannot be created until these are fixed. Click each button to grant the missing permission.'
            }
          </p>
          <div className="space-y-2">
            {sysPerms.permissions.map((p, i) => (
              <div key={i} className={`flex items-center justify-between gap-3 p-3 rounded-lg text-xs ${p.hasRole ? 'bg-green-500/5 border border-green-500/20' : 'bg-red-500/5 border border-red-500/20'
                }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${p.hasRole ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                    <span className={`font-semibold ${p.hasRole ? 'text-green-400' : 'text-red-400'}`}>{p.roleLabel}</span>
                  </div>
                  <p className="text-[10px] text-(--text-faint) mt-0.5 truncate">
                    {p.granteeLabel} → {p.contractLabel}
                  </p>
                </div>
                {p.hasRole ? (
                  <span className="text-[10px] text-green-400 font-semibold shrink-0">✓ OK</span>
                ) : (
                  <button
                    onClick={() => sysPerms.grantPermission(p.contract, p.role, p.grantee)}
                    disabled={sysPerms.grantPending || sysPerms.grantConfirming}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold text-[10px] transition-colors disabled:opacity-50 shrink-0"
                  >
                    {sysPerms.grantPending ? '⏳ Wallet...' : sysPerms.grantConfirming ? '⛓️ Confirming...' : 'Grant Role'}
                  </button>
                )}
              </div>
            ))}
          </div>
          {sysPerms.grantSuccess && (
            <div className="mt-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] flex items-center gap-2 animate-fade-in">
              <HiOutlineCheck className="w-3 h-3 shrink-0" />
              <span>Role granted successfully! Refreshing...</span>
            </div>
          )}
          {sysPerms.grantError && (
            <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px]">
              {parseContractError(sysPerms.grantError)}
            </div>
          )}
        </div>
      )}

      {/* Recent Active Events */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-(--text-primary)">Recent Active Events</h3>
          <button onClick={() => setActiveTab('events')} className="text-xs text-(--accent) hover:underline">View all</button>
        </div>
        {eventsLoading ? (
          <div className="py-6 text-center">
            <div className="w-5 h-5 border-2 border-(--accent) border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          </div>
        ) : activeEvents.length === 0 ? (
          <p className="text-xs text-(--text-muted) text-center py-4">No active events</p>
        ) : (
          <div className="space-y-2">
            {activeEvents.slice(0, 5).map(event => (
              <div key={event.id} className="flex items-center justify-between bg-(--surface-input) rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-(--text-primary)">{event.name}</p>
                  <p className="text-[10px] text-(--text-muted)">{event.region} &bull; &lt;{event.thresholdMm}mm</p>
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
      <h2 className="text-lg font-semibold text-(--text-primary) mb-6 flex items-center gap-2">
        <HiOutlinePlus className="w-5 h-5 text-(--accent)" /> {t.admin.createEvent}
      </h2>

      {/* Missing permissions warning */}
      {!sysPerms.isLoading && !sysPerms.allCriticalSet && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-6 text-xs text-red-400">
          <p className="font-semibold flex items-center gap-1.5">
            <HiOutlineExclamationTriangle className="w-4 h-4 shrink-0" />
            Contract permissions not configured — event creation will fail.
          </p>
          <p className="text-[10px] mt-1 opacity-80">
            Go to Overview tab and grant all missing inter-contract roles before creating events.
          </p>
          <button onClick={() => setActiveTab('overview')} className="mt-2 underline text-[10px] hover:opacity-80">Go to Overview</button>
        </div>
      )}

      {/* Collateral requirement info */}
      {(() => {
        const maxPayout = Number(payoutPerToken || 0) * Number(tokensToCreate || 0);
        const requiredCollateral = maxPayout * ((stats?.overcollateralizationRatio ?? 1500) / 1000);
        const availableEth = stats ? Number(formatEther(stats.availableLiquidity)) : 0;
        const hasEnough = availableEth >= requiredCollateral;
        return (
          <div className={`p-3 rounded-xl border mb-6 text-xs ${requiredCollateral > 0 && !hasEnough
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-(--surface-input) border-(--border) text-(--text-muted)'
            }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-semibold">Collateral required:</span>{' '}
                {requiredCollateral.toFixed(3)} ETH
                <span className="text-[10px] opacity-70 ml-1">
                  ({Number(payoutPerToken || 0)} × {tokensToCreate || 0} tokens × {((stats?.overcollateralizationRatio ?? 1500) / 10)}% ratio)
                </span>
              </div>
              <div>
                <span className="font-semibold">Pool available:</span>{' '}
                <span className={hasEnough ? 'text-green-400' : 'text-red-400'}>{availableEth.toFixed(3)} ETH</span>
              </div>
            </div>
            {requiredCollateral > 0 && !hasEnough && (
              <p className="mt-1 text-[10px] font-medium">
                ⚠️ Not enough liquidity! Deposit at least {(requiredCollateral - availableEth).toFixed(3)} more ETH in the Liquidity tab before creating this event.
              </p>
            )}
          </div>
        );
      })()}

      <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs text-(--text-secondary) uppercase font-semibold">{t.admin.eventName}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.admin.eventNamePlaceholder} className="w-full h-12 bg-(--surface-input) border border-(--border) rounded-xl px-4 text-(--text-primary) focus:border-(--accent) outline-none transition-colors" required />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-(--text-secondary) uppercase font-semibold">{t.admin.targetRegion}</label>
          <RegionSearch
            value={region}
            onChange={setRegion}
            onSelect={(geo: GeoResult) => {
              setLatitude(geo.lat.toFixed(4));
              setLongitude(geo.lon.toFixed(4));
            }}
            placeholder={t.admin.regionPlaceholder}
          />
          <p className="text-[10px] text-(--text-muted)">Type a city name to search. Coordinates will be filled automatically.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-(--text-secondary) uppercase font-semibold">Latitude</label>
            <input type="number" step="0.0001" value={latitude} onChange={e => setLatitude(e.target.value)} className="w-full h-12 bg-(--surface-input) border border-(--border) rounded-xl px-4 text-(--text-primary) focus:border-(--accent) outline-none transition-colors font-mono text-sm" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-(--text-secondary) uppercase font-semibold">Longitude</label>
            <input type="number" step="0.0001" value={longitude} onChange={e => setLongitude(e.target.value)} className="w-full h-12 bg-(--surface-input) border border-(--border) rounded-xl px-4 text-(--text-primary) focus:border-(--accent) outline-none transition-colors font-mono text-sm" required />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-(--text-secondary) uppercase font-semibold">{t.admin.thresholdMm}</label>
          <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} className="w-full h-12 bg-(--surface-input) border border-(--border) rounded-xl px-4 text-(--text-primary) focus:border-(--accent) outline-none transition-colors" required />
          <p className="text-[10px] text-(--text-muted)">{t.admin.thresholdHint}</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-(--text-secondary) uppercase font-semibold">{t.admin.payoutPerToken}</label>
          <input type="number" step="0.001" value={payoutPerToken} onChange={e => setPayoutPerToken(e.target.value)} className="w-full h-12 bg-(--surface-input) border border-(--border) rounded-xl px-4 text-(--text-primary) focus:border-(--accent) outline-none transition-colors" required />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-(--text-secondary) uppercase font-semibold">{t.admin.tokensToCreate}</label>
          <input type="number" value={tokensToCreate} onChange={e => setTokensToCreate(e.target.value)} className="w-full h-12 bg-(--surface-input) border border-(--border) rounded-xl px-4 text-(--text-primary) focus:border-(--accent) outline-none transition-colors" required />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-(--text-secondary) uppercase font-semibold">{t.admin.durationDays}</label>
          <input type="number" value={durationDays} onChange={e => setDurationDays(e.target.value)} className="w-full h-12 bg-(--surface-input) border border-(--border) rounded-xl px-4 text-(--text-primary) focus:border-(--accent) outline-none transition-colors" required />
        </div>
        <div className="md:col-span-2 pt-2 space-y-3">
          {/* Transaction step indicator */}
          {(createPending || createConfirming) && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-(--accent-glow) border border-(--accent)/20 animate-fade-in">
              <div className="w-5 h-5 border-2 border-(--accent) border-t-transparent rounded-full animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-(--accent)">
                  {createPending ? 'Step 1/2 — Confirm in your wallet' : 'Step 2/2 — Confirming on blockchain...'}
                </p>
                <p className="text-[10px] text-(--text-muted)">
                  {createPending ? 'Check MetaMask or your wallet for the approval popup' : 'This usually takes 15-30 seconds on Sepolia'}
                </p>
              </div>
            </div>
          )}
          {createReverted && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
              <HiOutlineExclamationTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-400">Transaction reverted on-chain</p>
                <p className="text-[10px] text-red-400/70 mt-1">The contract rejected this operation. Common causes: insufficient pool liquidity, missing role, or invalid parameters.</p>
              </div>
              <button onClick={resetCreate} className="text-red-400/50 hover:text-red-400 shrink-0"><HiOutlineXMark className="w-4 h-4" /></button>
            </div>
          )}
          {createError && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
              <HiOutlineExclamationTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-400">{parseContractError(createError)}</p>
                <details className="mt-1">
                  <summary className="text-[10px] text-red-400/60 cursor-pointer hover:text-red-400/80">Technical details</summary>
                  <p className="text-[10px] text-red-400/50 mt-1 break-all font-mono">{createError.message?.slice(0, 300)}</p>
                </details>
              </div>
              <button onClick={resetCreate} className="text-red-400/50 hover:text-red-400 shrink-0"><HiOutlineXMark className="w-4 h-4" /></button>
            </div>
          )}
          {(() => {
            const maxPayout = Number(payoutPerToken || 0) * Number(tokensToCreate || 0);
            const requiredCollateral = maxPayout * ((stats?.overcollateralizationRatio ?? 1500) / 1000);
            const availableEth = stats ? Number(formatEther(stats.availableLiquidity)) : 0;
            const insufficientLiquidity = requiredCollateral > 0 && availableEth < requiredCollateral;
            return (
              <button type="submit" disabled={loading || insufficientLiquidity} className={`w-full py-4 rounded-xl font-bold transition-all ${loading || insufficientLiquidity ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'btn-primary'}`}>
                {insufficientLiquidity ? `⚠️ Insufficient liquidity (need ${requiredCollateral.toFixed(2)} ETH)` : createPending ? '⏳ Waiting for wallet...' : createConfirming ? '⛓️ Confirming on chain...' : t.admin.createBtn}
              </button>
            );
          })()}
        </div>
      </form>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-(--text-primary) flex items-center gap-2">
          <HiOutlineChartBar className="w-5 h-5 text-cyan-400" /> All Events ({events.length})
        </h2>
      </div>
      {eventsLoading ? (
        <div className="glass p-8 rounded-xl text-center">
          <div className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-(--text-muted)">{t.admin.loadingEvents}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center">
          <HiOutlineChartBar className="w-10 h-10 text-(--text-faint) mx-auto mb-3" />
          <p className="text-sm text-(--text-muted)">No events created yet.</p>
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
                    <h3 className="text-base font-semibold text-(--text-primary)">{event.name}</h3>
                    <p className="text-xs text-(--text-muted)">{event.region}, {event.state}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[event.status] || statusColors.EXPIRED}`}>
                      {event.status}
                    </span>
                    {event.payoutTriggered && (
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-(--accent-glow) text-(--accent) border border-(--accent)/20">PAYOUT</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                  <div className="bg-(--surface-input) rounded-lg py-2 px-3">
                    <p className="text-[9px] text-(--text-faint) uppercase">Threshold</p>
                    <p className="text-sm font-bold text-(--text-primary)">{event.thresholdMm}mm</p>
                  </div>
                  <div className="bg-(--surface-input) rounded-lg py-2 px-3">
                    <p className="text-[9px] text-(--text-faint) uppercase">Actual</p>
                    <p className="text-sm font-bold text-(--text-primary)">{event.actualMm ?? '—'}mm</p>
                  </div>
                  <div className="bg-(--surface-input) rounded-lg py-2 px-3">
                    <p className="text-[9px] text-(--text-faint) uppercase">Supply</p>
                    <p className="text-sm font-bold text-(--text-primary)">{event.totalSupply}</p>
                  </div>
                  <div className="bg-(--surface-input) rounded-lg py-2 px-3">
                    <p className="text-[9px] text-(--text-faint) uppercase">Available</p>
                    <p className="text-sm font-bold text-(--text-primary)">{event.availableTokens}</p>
                  </div>
                  <div className="bg-(--surface-input) rounded-lg py-2 px-3">
                    <p className="text-[9px] text-(--text-faint) uppercase">Payout/Token</p>
                    <p className="text-sm font-bold text-(--accent)">{Number(formatEther(event.payoutPerToken)).toFixed(3)} ETH</p>
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
      <h2 className="text-lg font-semibold text-(--text-primary) mb-4 flex items-center gap-2">
        <HiOutlineCpuChip className="w-5 h-5 text-(--chainlink)" /> {t.admin.manualSettlement}
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {eventsLoading ? (
          <div className="glass p-8 rounded-xl text-center">
            <div className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-(--text-muted)">{t.admin.loadingEvents}</p>
          </div>
        ) : activeEvents.length === 0 ? (
          <div className="glass rounded-xl p-10 text-center">
            <HiOutlineCpuChip className="w-10 h-10 text-(--text-faint) mx-auto mb-3" />
            <p className="text-sm text-(--text-muted)">{t.admin.noActiveEvents}</p>
            <p className="text-xs text-(--text-faint) mt-1">Create an event first to trigger settlement.</p>
          </div>
        ) : (
          activeEvents.map(event => (
            <div key={event.id} className="glass p-5 rounded-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-(--text-primary)">{event.name}</h3>
                  <p className="text-xs text-(--text-muted)">{event.region} &bull; Threshold: &lt; {event.thresholdMm}mm &bull; Tokens: {event.totalSupply}</p>
                  <p className="text-[10px] text-(--text-faint) mt-1">
                    {new Date(event.startTime * 1000).toLocaleDateString('en-US')} — {new Date(event.endTime * 1000).toLocaleDateString('en-US')}
                  </p>
                </div>
                <button
                  onClick={() => handleSettle(event.eventId)}
                  disabled={loading}
                  className="px-5 py-2.5 bg-(--chainlink)/10 hover:bg-(--chainlink)/20 text-(--chainlink) border border-(--chainlink)/20 rounded-xl text-xs font-semibold transition-colors shrink-0"
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
        <h2 className="text-lg font-semibold text-(--text-primary) mb-2 flex items-center gap-2">
          <HiOutlineShieldCheck className="w-5 h-5 text-(--accent)" /> {t.admin.roleManagement}
        </h2>
        <p className="text-xs text-(--text-muted)">
          As <span className="text-red-400 font-semibold">Default Admin</span>, {t.admin.roleManagementDesc}
        </p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-xs text-(--text-secondary) uppercase font-semibold">{t.admin.walletAddress}</label>
            <input
              type="text"
              value={roleAddress}
              onChange={e => setRoleAddress(e.target.value)}
              placeholder="0x..."
              className="w-full h-12 bg-(--surface-input) border border-(--border) rounded-xl px-4 text-(--text-primary) font-mono text-sm focus:border-(--accent) outline-none transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-(--text-secondary) uppercase font-semibold">{t.admin.role}</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as typeof selectedRole)}
              className="w-full h-12 bg-(--surface-input) border border-(--border) rounded-xl px-4 text-(--text-primary) text-sm focus:border-(--accent) outline-none transition-colors"
            >
              <option value="EVENT_CREATOR">Event Creator (Factory)</option>
              <option value="SETTLEMENT_ADMIN">Settlement Admin (Engine)</option>
              <option value="PROTOCOL_ADMIN">Protocol Admin (ClimProtocol)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-(--text-secondary) uppercase font-semibold">{t.admin.action}</label>
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

        <div className="bg-(--surface-input) rounded-xl p-4 text-xs text-(--text-muted) space-y-1">
          <p className="font-semibold text-(--text-secondary) mb-2">{t.admin.roleDescriptions}</p>
          <p><span className="text-green-400 font-medium">Event Creator</span> — {t.admin.eventCreatorDesc}</p>
          <p><span className="text-blue-400 font-medium">Settlement Admin</span> — {t.admin.settlementAdminDesc}</p>
          <p><span className="text-purple-400 font-medium">Protocol Admin</span> — {t.admin.protocolAdminDesc}</p>
        </div>
      </div>
    </div>
  );

  const renderLiquidity = () => <LiquidityPanel />;

  const tabRenderers: Record<AdminTab, () => React.ReactNode> = {
    overview: renderOverview,
    create: renderCreateEvent,
    events: renderEvents,
    liquidity: renderLiquidity,
    settlement: renderSettlement,
    roles: renderRoles,
  };

  // ─── Admin Dashboard with Sidebar ───
  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 right-6 z-50 md:hidden w-12 h-12 rounded-full bg-(--accent) text-(--bg-primary) flex items-center justify-center shadow-lg"
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
        bg-(--bg-secondary) md:bg-transparent
        border-r border-(--border) md:border-r-0
        flex flex-col gap-1 p-4 md:pr-6 md:pl-0 pt-6
        overflow-y-auto
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="mb-5 px-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-(--accent-glow) flex items-center justify-center">
              <HiOutlineShieldCheck className="w-4 h-4 text-(--accent)" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-(--text-primary)">{t.admin.title}</h2>
              <p className="text-[9px] text-(--text-faint)">{t.admin.adminMode}</p>
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
                    ? 'bg-(--accent-glow) text-(--accent) shadow-sm'
                    : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-hover)'
                  }
                `}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-(--accent)' : item.color}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-4 px-3 border-t border-(--border)">
          <div className="flex flex-wrap gap-1 mb-2">
            {roles.isDefaultAdmin && <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">ADMIN</span>}
            {roles.isEventCreator && <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">CREATOR</span>}
            {roles.isSettlementAdmin && <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">SETTLE</span>}
          </div>
          <p className="text-[9px] text-(--text-faint) font-mono truncate">{roles.address}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 px-2 md:px-6 py-6">
        {/* Top bar with notification */}
        {notification && (
          <div className={`p-3 rounded-xl border flex items-start gap-3 mb-6 animate-fade-in ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
            notification.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              notification.type === 'confirming' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
            }`}>
            {(notification.type === 'pending' || notification.type === 'confirming') ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
            ) : notification.type === 'error' ? (
              <HiOutlineExclamationTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <HiOutlineCheck className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-sm">{notification.message}</span>
              {notification.type === 'confirming' && elapsedSec > 0 && (
                <span className="text-[10px] opacity-60 ml-2">({elapsedSec}s)</span>
              )}
              {notification.hash && (
                <a href={etherscanTxUrl(notification.hash)} target="_blank" rel="noopener noreferrer"
                  className="block text-[10px] opacity-70 hover:opacity-100 underline mt-0.5 font-mono truncate">
                  View on Etherscan: {notification.hash.slice(0, 10)}...{notification.hash.slice(-8)}
                </a>
              )}
              {notification.detail && (
                <details className="mt-1">
                  <summary className="text-[10px] opacity-60 cursor-pointer hover:opacity-80">Details</summary>
                  <p className="text-[10px] opacity-50 mt-1 break-all font-mono">{notification.detail}</p>
                </details>
              )}
            </div>
            <button onClick={() => { setNotification(null); resetCreate(); resetSettle(); resetGrant(); resetRevoke(); }} className="opacity-50 hover:opacity-100 shrink-0">
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        {tabRenderers[activeTab]?.() ?? renderOverview()}
      </main>
    </div>
  );
}
