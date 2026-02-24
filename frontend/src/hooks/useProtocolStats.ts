'use client';

import { useReadContracts } from 'wagmi';
import { CONTRACTS } from '@/constants/contracts';
import { CLIM_PROTOCOL_ABI } from '@/constants/abis/ClimProtocol';
import { LIQUIDITY_POOL_ABI } from '@/constants/abis/LiquidityPool';
import type { ProtocolStats } from '@/services/types';

/**
 * Reads protocol-level statistics from ClimProtocol + LiquidityPool contracts.
 */
export function useProtocolStats() {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.PROTOCOL,
        abi: CLIM_PROTOCOL_ABI,
        functionName: 'getProtocolStats',
      },
      {
        address: CONTRACTS.POOL,
        abi: LIQUIDITY_POOL_ABI,
        functionName: 'totalLockedCollateral',
      },
      {
        address: CONTRACTS.POOL,
        abi: LIQUIDITY_POOL_ABI,
        functionName: 'overcollateralizationRatio',
      },
    ],
    query: {
      refetchInterval: 30_000, // Refresh every 30s
    },
  });

  const stats: ProtocolStats | null = data && data[0].result && data[1].result !== undefined && data[2].result !== undefined
    ? {
      totalLiquidity: (data[0].result as readonly [bigint, bigint, bigint, string])[0],
      availableLiquidity: (data[0].result as readonly [bigint, bigint, bigint, string])[1],
      lockedCollateral: data[1].result as bigint,
      activeEvents: Number((data[0].result as readonly [bigint, bigint, bigint, string])[2]),
      totalTokensSold: 0, // Computed client-side from events if needed
      overcollateralizationRatio: Number(data[2].result as bigint),
      version: (data[0].result as readonly [bigint, bigint, bigint, string])[3],
    }
    : null;

  return { stats, isLoading, error, refetch };
}
