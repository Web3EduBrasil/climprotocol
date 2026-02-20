// ============================================
// Contract Service — Façade for Frente 2
// ============================================
// This service abstracts ALL on-chain reads/writes.
// Currently returns mock data. When contracts are deployed:
//   1. Replace mock implementations with wagmi hooks
//   2. The rest of the frontend stays untouched
// ============================================

import type {
  ClimateEvent,
  ProtocolStats,
  PortfolioItem,
  LiquidityDataPoint,
  PrecipitationDataPoint,
  TxResult,
} from './types';
import {
  mockProtocolStats,
  mockEvents,
  mockPortfolio,
  mockPrecipitationData,
  mockLPHistory,
  isMockMode,
} from '@/config/mockData';

// ─── READS ───────────────────────────────────

/** Get protocol-level stats (TVL, events, etc.) */
export async function getProtocolStats(): Promise<ProtocolStats> {
  // TODO [FRENTE 2]: Replace with wagmi readContract call to ClimProtocol.getProtocolStats()
  return mockProtocolStats;
}

/** Get all climate events */
export async function getClimateEvents(): Promise<ClimateEvent[]> {
  // TODO [FRENTE 2]: Replace with on-chain event enumeration
  return mockEvents;
}

/** Get events filtered by status */
export async function getEventsByStatus(status: 'ACTIVE' | 'SETTLED' | 'EXPIRED'): Promise<ClimateEvent[]> {
  const events = await getClimateEvents();
  return events.filter(e => e.status === status);
}

/** Get single event by ID */
export async function getEventById(eventId: bigint): Promise<ClimateEvent | undefined> {
  // TODO [FRENTE 2]: Replace with ClimProtocol.getEventDetails(eventId)
  const events = await getClimateEvents();
  return events.find(e => e.eventId === eventId);
}

/** Get user portfolio (requires connected wallet address) */
export async function getUserPortfolio(address?: string): Promise<PortfolioItem[]> {
  // TODO [FRENTE 2]: Replace with ClimProtocol.getUserPortfolio(address)
  if (!address) return [];
  return mockPortfolio;
}

/** Get precipitation chart data for a region */
export async function getPrecipitationData(): Promise<PrecipitationDataPoint[]> {
  // TODO [FRENTE 2]: This could come from an API or cached oracle data
  return mockPrecipitationData;
}

/** Get LP history for chart */
export async function getLiquidityHistory(): Promise<LiquidityDataPoint[]> {
  // TODO [FRENTE 2]: Build from on-chain event logs
  return mockLPHistory;
}

/** Get user's LP balance */
export async function getUserLPBalance(address?: string): Promise<{ balance: number; yield: number }> {
  // TODO [FRENTE 2]: Replace with LiquidityPool.getLPBalance(address)
  if (!address) return { balance: 0, yield: 0 };
  return { balance: 5.2, yield: 0.32 };
}

// ─── WRITES ──────────────────────────────────

/** Buy CET tokens for an event */
export async function buyTokens(eventId: bigint, quantity: number, premiumWei: bigint): Promise<TxResult> {
  // TODO [FRENTE 2]: Replace with wagmi writeContract to ClimProtocol.quickBuy()
  //   const { writeContract } = useWriteContract();
  //   writeContract({
  //     address: CONTRACTS.protocol,
  //     abi: CLIM_PROTOCOL_ABI,
  //     functionName: 'quickBuy',
  //     args: [eventId, BigInt(quantity)],
  //     value: premiumWei * BigInt(quantity),
  //   });
  console.log(`[MOCK] Buying ${quantity} tokens for event ${eventId}`);
  await _simulateDelay();
  return { success: true, hash: '0x' + 'a'.repeat(64) };
}

/** Deposit liquidity into the pool */
export async function depositLiquidity(amountWei: bigint): Promise<TxResult> {
  // TODO [FRENTE 2]: Replace with wagmi writeContract to ClimProtocol.provideLiquidity()
  console.log(`[MOCK] Depositing ${amountWei} wei`);
  await _simulateDelay();
  return { success: true, hash: '0x' + 'b'.repeat(64) };
}

/** Withdraw liquidity from the pool */
export async function withdrawLiquidity(amountWei: bigint): Promise<TxResult> {
  // TODO [FRENTE 2]: Replace with wagmi writeContract to LiquidityPool.withdraw()
  console.log(`[MOCK] Withdrawing ${amountWei} wei`);
  await _simulateDelay();
  return { success: true, hash: '0x' + 'c'.repeat(64) };
}

/** Redeem tokens for settled events */
export async function redeemTokens(eventIds: bigint[]): Promise<TxResult> {
  // TODO [FRENTE 2]: Replace with ClimProtocol.batchRedeemTokens()
  console.log(`[MOCK] Redeeming tokens for events: ${eventIds.map(String).join(', ')}`);
  await _simulateDelay();
  return { success: true, hash: '0x' + 'd'.repeat(64) };
}

// ─── HELPERS ─────────────────────────────────

function _simulateDelay(ms = 1500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Check if running in mock mode */
export { isMockMode };
