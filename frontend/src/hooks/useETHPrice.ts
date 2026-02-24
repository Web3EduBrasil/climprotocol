'use client';

import { useReadContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';

/**
 * Chainlink ETH / USD Price Feed on Sepolia.
 * Read-only — costs zero gas / zero LINK.
 * Aggregator proxy: 0x694AA1769357215DE4FAC081bf1f309aDC325306
 * Docs: https://docs.chain.link/data-feeds/price-feeds/addresses
 */
const PRICE_FEED_ADDRESS = '0x694AA1769357215DE4FAC081bf1f309aDC325306' as const;

const aggregatorV3Abi = [
  {
    name: 'latestRoundData',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'roundId', type: 'uint80' },
      { name: 'answer', type: 'int256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80' },
    ],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

export function useETHPrice() {
  const { data: roundData, isLoading: roundLoading } = useReadContract({
    address: PRICE_FEED_ADDRESS,
    abi: aggregatorV3Abi,
    functionName: 'latestRoundData',
    chainId: sepolia.id,
    query: { refetchInterval: 60_000 }, // refresh every 60s
  });

  const { data: decimalsRaw } = useReadContract({
    address: PRICE_FEED_ADDRESS,
    abi: aggregatorV3Abi,
    functionName: 'decimals',
    chainId: sepolia.id,
  });

  const decimals = decimalsRaw ?? 8;
  const answer = roundData?.[1];
  const updatedAt = roundData?.[3];

  const ethPrice =
    answer !== undefined && answer !== null
      ? Number(answer) / 10 ** Number(decimals)
      : null;

  const lastUpdated =
    updatedAt !== undefined && updatedAt !== null
      ? new Date(Number(updatedAt) * 1000)
      : null;

  /** Convert ETH amount to formatted USD string */
  const ethToUsd = (ethAmount: number): string | null => {
    if (ethPrice === null) return null;
    return (ethAmount * ethPrice).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return {
    ethPrice,
    lastUpdated,
    isLoading: roundLoading,
    ethToUsd,
  };
}
