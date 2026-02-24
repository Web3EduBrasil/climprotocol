// ============================================
// Contract Service — Re-exports
// ============================================
// This file is kept for backwards-compatibility.
// All on-chain reads/writes are now handled by wagmi hooks in /hooks/.
// Types are re-exported here for any remaining consumers.
// ============================================

export type {
  ClimateEvent,
  ProtocolStats,
  PortfolioItem,
  LiquidityDataPoint,
  PrecipitationDataPoint,
  TxResult,
  EventStatus,
} from './types';
