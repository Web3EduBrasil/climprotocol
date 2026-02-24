'use client';

import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { CONTRACTS } from '@/constants/contracts';
import { LIQUIDITY_POOL_ABI } from '@/constants/abis/LiquidityPool';

/**
 * Reads the connected user's LP balance from LiquidityPool.getLPBalance().
 */
export function useLPBalance() {
  const { address, isConnected } = useAccount();

  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: CONTRACTS.POOL,
    abi: LIQUIDITY_POOL_ABI,
    functionName: 'getLPBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 15_000,
    },
  });

  return {
    balance: (balance as bigint) ?? 0n,
    isLoading,
    error,
    refetch,
    isConnected,
  };
}
