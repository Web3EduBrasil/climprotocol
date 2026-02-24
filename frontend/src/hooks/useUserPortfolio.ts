'use client';

import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { CONTRACTS } from '@/constants/contracts';
import { CLIM_PROTOCOL_ABI } from '@/constants/abis/ClimProtocol';
import type { PortfolioItem, EventStatus } from '@/services/types';

const STATUS_MAP: Record<number, EventStatus> = {
  0: 'ACTIVE',
  1: 'SETTLED',
  2: 'EXPIRED',
};

/**
 * Reads the connected user's portfolio from ClimProtocol.getUserPortfolio().
 */
export function useUserPortfolio() {
  const { address, isConnected } = useAccount();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  const {
    data: portfolioData,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: CONTRACTS.PROTOCOL,
    abi: CLIM_PROTOCOL_ABI,
    functionName: 'getUserPortfolio',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 30_000,
    },
  });

  useEffect(() => {
    if (!portfolioData) {
      setPortfolio([]);
      return;
    }

    const [eventIds, tokenBalances, potentialPayouts, canRedeem] = portfolioData as [
      readonly bigint[],
      readonly bigint[],
      readonly bigint[],
      readonly boolean[],
    ];

    const items: PortfolioItem[] = [];
    for (let i = 0; i < eventIds.length; i++) {
      items.push({
        eventId: eventIds[i],
        eventName: `Evento #${eventIds[i].toString().slice(0, 8)}`,
        tokenBalance: Number(tokenBalances[i]),
        potentialPayout: potentialPayouts[i],
        canRedeem: canRedeem[i],
        status: canRedeem[i] ? 'SETTLED' : 'ACTIVE',
      });
    }

    setPortfolio(items);
  }, [portfolioData]);

  return { portfolio, isLoading, error, refetch, isConnected };
}
