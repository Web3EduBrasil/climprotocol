'use client';

import { useReadContract, useReadContracts } from 'wagmi';
import { useEffect, useState } from 'react';
import { CONTRACTS } from '@/constants/contracts';
import { SETTLEMENT_ENGINE_ABI } from '@/constants/abis/SettlementEngine';
import { CLIM_PROTOCOL_ABI } from '@/constants/abis/ClimProtocol';
import type { ClimateEvent, EventStatus } from '@/services/types';

const STATUS_MAP: Record<number, EventStatus> = {
  0: 'ACTIVE',
  1: 'SETTLED',
  2: 'EXPIRED',
};

/**
 * Reads all climate events from the on-chain contracts.
 * 1. Fetches active event IDs from SettlementEngine.getActiveEvents()
 * 2. For each eventId, calls ClimProtocol.getEventDetails() via multicall
 */
export function useClimateEvents() {
  const [events, setEvents] = useState<ClimateEvent[]>([]);

  // Step 1: Get all active event IDs
  const {
    data: activeEventIds,
    isLoading: idsLoading,
    error: idsError,
    refetch: refetchIds,
  } = useReadContract({
    address: CONTRACTS.SETTLEMENT,
    abi: SETTLEMENT_ENGINE_ABI,
    functionName: 'getActiveEvents',
    query: {
      refetchInterval: 30_000,
    },
  });

  // Step 2: For each event ID, get its details via multicall
  const eventIds = (activeEventIds as bigint[]) || [];

  const detailContracts = eventIds.map((id) => ({
    address: CONTRACTS.PROTOCOL,
    abi: CLIM_PROTOCOL_ABI,
    functionName: 'getEventDetails' as const,
    args: [id] as const,
  }));

  const {
    data: detailsData,
    isLoading: detailsLoading,
    error: detailsError,
    refetch: refetchDetails,
  } = useReadContracts({
    contracts: detailContracts,
    query: {
      enabled: eventIds.length > 0,
      refetchInterval: 30_000,
    },
  });

  useEffect(() => {
    if (!detailsData || eventIds.length === 0) {
      setEvents([]);
      return;
    }

    const parsed: ClimateEvent[] = [];

    for (let i = 0; i < eventIds.length; i++) {
      const result = detailsData[i];
      if (result.status !== 'success' || !result.result) continue;

      const [eventData, availableTokens, currentPremium, isSettled] = result.result as [
        {
          latitude: bigint;
          longitude: bigint;
          startTime: bigint;
          endTime: bigint;
          thresholdMm: bigint;
          payoutPerToken: bigint;
          totalSupply: bigint;
          actualMm: bigint;
          status: number;
        },
        bigint,
        bigint,
        boolean,
      ];

      const statusNum = Number(eventData.status);
      const status = STATUS_MAP[statusNum] || 'ACTIVE';
      const actualMm = Number(eventData.actualMm);
      const thresholdMm = Number(eventData.thresholdMm);

      parsed.push({
        id: eventIds[i].toString(),
        eventId: eventIds[i],
        name: `Evento #${eventIds[i].toString().slice(0, 8)}`,
        region: `${(Number(eventData.latitude) / 1e6).toFixed(2)}°, ${(Number(eventData.longitude) / 1e6).toFixed(2)}°`,
        state: 'NE',
        latitude: Number(eventData.latitude) / 1e6,
        longitude: Number(eventData.longitude) / 1e6,
        startTime: Number(eventData.startTime),
        endTime: Number(eventData.endTime),
        thresholdMm,
        payoutPerToken: eventData.payoutPerToken,
        totalSupply: Number(eventData.totalSupply),
        availableTokens: Number(availableTokens),
        premiumPerToken: currentPremium,
        status: isSettled ? 'SETTLED' : status,
        actualMm: actualMm > 0 ? actualMm : undefined,
        payoutTriggered: isSettled ? actualMm < thresholdMm : undefined,
      });
    }

    setEvents(parsed);
  }, [detailsData, eventIds]);

  const refetch = () => {
    refetchIds();
    refetchDetails();
  };

  return {
    events,
    isLoading: idsLoading || detailsLoading,
    error: idsError || detailsError,
    refetch,
  };
}
