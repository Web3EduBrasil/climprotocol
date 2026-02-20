import { type Address } from 'viem';

// ============================================
// Contract Addresses (loaded from .env.local)
// ============================================

export const CONTRACTS = {
  protocol: (process.env.NEXT_PUBLIC_PROTOCOL_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
  token: (process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
  factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
  pool: (process.env.NEXT_PUBLIC_POOL_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
  settlement: (process.env.NEXT_PUBLIC_SETTLEMENT_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
  oracle: (process.env.NEXT_PUBLIC_ORACLE_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
} as const;

// ============================================
// ABI — ClimProtocol (Facade)
// ============================================
export const CLIM_PROTOCOL_ABI = [
  {
    name: 'getProtocolStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'totalLiquidity', type: 'uint256' },
      { name: 'availableLiquidity', type: 'uint256' },
      { name: 'activeEvents', type: 'uint256' },
      { name: 'version', type: 'string' },
    ],
  },
  {
    name: 'getEventDetails',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [
      {
        name: 'eventData',
        type: 'tuple',
        components: [
          { name: 'latitude', type: 'int256' },
          { name: 'longitude', type: 'int256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'thresholdMm', type: 'uint256' },
          { name: 'payoutPerToken', type: 'uint256' },
          { name: 'totalSupply', type: 'uint256' },
          { name: 'actualMm', type: 'uint256' },
          { name: 'status', type: 'uint8' },
        ],
      },
      { name: 'availableTokens', type: 'uint256' },
      { name: 'currentPremium', type: 'uint256' },
      { name: 'isSettled', type: 'bool' },
    ],
  },
  {
    name: 'quickBuy',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'tokenAmount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'provideLiquidity',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'batchRedeemTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'eventIds', type: 'uint256[]' }],
    outputs: [],
  },
  {
    name: 'getUserPortfolio',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'eventIds', type: 'uint256[]' },
      { name: 'tokenBalances', type: 'uint256[]' },
      { name: 'potentialPayouts', type: 'uint256[]' },
      { name: 'canRedeem', type: 'bool[]' },
    ],
  },
  {
    name: 'getContractAddresses',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'tokenContract', type: 'address' },
      { name: 'factoryContract', type: 'address' },
      { name: 'poolContract', type: 'address' },
      { name: 'settlementContract', type: 'address' },
      { name: 'oracleContract', type: 'address' },
    ],
  },
] as const;

// ============================================
// ABI — ClimateEventFactory
// ============================================
export const FACTORY_ABI = [
  {
    name: 'buyClimateTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'tokenAmount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'calculatePremium',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'payoutPerToken', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getAvailableTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getEventPremium',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'eventCounter',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ============================================
// ABI — LiquidityPool
// ============================================
export const POOL_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'totalLiquidity',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'availableLiquidity',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalLockedCollateral',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'overcollateralizationRatio',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getLPBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'provider', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'lpBalances',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ============================================
// ABI — SettlementEngine
// ============================================
export const SETTLEMENT_ABI = [
  {
    name: 'getActiveEvents',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'getActiveEventCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'isEventSettled',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'eventsRequested',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// ============================================
// ABI — ClimateEventToken (ERC-1155)
// ============================================
export const TOKEN_ABI = [
  {
    name: 'getEventData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'latitude', type: 'int256' },
          { name: 'longitude', type: 'int256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'thresholdMm', type: 'uint256' },
          { name: 'payoutPerToken', type: 'uint256' },
          { name: 'totalSupply', type: 'uint256' },
          { name: 'actualMm', type: 'uint256' },
          { name: 'status', type: 'uint8' },
        ],
      },
    ],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'redeemTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'isEventTriggered',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'hasRedeemed',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
