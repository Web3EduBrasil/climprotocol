// ============================================
// Core Domain Types for Clim Protocol
// Used by hooks, components, and pages
// ============================================

export type EventStatus = 'ACTIVE' | 'SETTLED' | 'EXPIRED';

/** On-chain climate event data */
export interface ClimateEvent {
  id: string;
  eventId: bigint;
  name: string;
  region: string;
  state: string;
  latitude: number;
  longitude: number;
  startTime: number;
  endTime: number;
  thresholdMm: number;
  payoutPerToken: bigint;
  totalSupply: number;
  availableTokens: number;
  premiumPerToken: bigint;
  status: EventStatus;
  actualMm?: number;
  payoutTriggered?: boolean;
}

/** Protocol-level statistics */
export interface ProtocolStats {
  totalLiquidity: bigint;
  availableLiquidity: bigint;
  lockedCollateral: bigint;
  activeEvents: number;
  totalTokensSold: number;
  overcollateralizationRatio: number;
  version: string;
}

/** User portfolio item (per event) */
export interface PortfolioItem {
  eventId: bigint;
  eventName: string;
  tokenBalance: number;
  potentialPayout: bigint;
  canRedeem: boolean;
  status: EventStatus;
}

/** Liquidity pool historical data point */
export interface LiquidityDataPoint {
  date: string;
  totalLiquidity: number;
  availableLiquidity: number;
}

/** Precipitation data point for charts */
export interface PrecipitationDataPoint {
  day: number;
  date: string;
  daily: number;
  accumulated: number;
}

/** Transaction result from contract writes */
export interface TxResult {
  success: boolean;
  hash?: string;
  error?: string;
}
