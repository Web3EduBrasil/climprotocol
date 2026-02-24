// ============================================
// Backward-compatibility re-exports
// ============================================
// Canonical sources:
//   Addresses   @/constants/contracts
//   ABIs        @/constants/abis/*
// ============================================

export { CONTRACTS, CHAIN_ID, RPC_URL } from '@/constants/contracts';
export { CLIM_PROTOCOL_ABI } from '@/constants/abis/ClimProtocol';
export { CLIMATE_EVENT_FACTORY_ABI as FACTORY_ABI } from '@/constants/abis/ClimateEventFactory';
export { LIQUIDITY_POOL_ABI as POOL_ABI } from '@/constants/abis/LiquidityPool';
export { SETTLEMENT_ENGINE_ABI as SETTLEMENT_ABI } from '@/constants/abis/SettlementEngine';
export { CLIMATE_EVENT_TOKEN_ABI as TOKEN_ABI } from '@/constants/abis/ClimateEventToken';
