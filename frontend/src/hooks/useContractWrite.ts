'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACTS } from '@/constants/contracts';
import { CLIM_PROTOCOL_ABI } from '@/constants/abis/ClimProtocol';
import { LIQUIDITY_POOL_ABI } from '@/constants/abis/LiquidityPool';
import { CLIMATE_EVENT_FACTORY_ABI } from '@/constants/abis/ClimateEventFactory';
import { SETTLEMENT_ENGINE_ABI } from '@/constants/abis/SettlementEngine';

/**
 * Hook for buying climate event tokens via ClimProtocol.quickBuy()
 */
export function useQuickBuy() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isReceived } = useWaitForTransactionReceipt({ hash });

  const isReverted = isReceived && receipt?.status === 'reverted';
  const isSuccess = isReceived && receipt?.status === 'success';

  const buy = (eventId: bigint, quantity: number, premiumPerToken: bigint) => {
    const totalValue = premiumPerToken * BigInt(quantity);
    writeContract({
      address: CONTRACTS.PROTOCOL,
      abi: CLIM_PROTOCOL_ABI,
      functionName: 'quickBuy',
      args: [eventId, BigInt(quantity)],
      value: totalValue,
    });
  };

  return { buy, hash, isPending, isConfirming, isSuccess, isReverted, error, reset };
}

/**
 * Hook for depositing liquidity via ClimProtocol.provideLiquidity()
 */
export function useProvideLiquidity() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isReceived } = useWaitForTransactionReceipt({ hash });

  const isReverted = isReceived && receipt?.status === 'reverted';
  const isSuccess = isReceived && receipt?.status === 'success';

  const deposit = (amountEth: string) => {
    writeContract({
      address: CONTRACTS.PROTOCOL,
      abi: CLIM_PROTOCOL_ABI,
      functionName: 'provideLiquidity',
      value: parseEther(amountEth),
    });
  };

  return { deposit, hash, isPending, isConfirming, isSuccess, isReverted, error, reset };
}

/**
 * Hook for withdrawing liquidity from LiquidityPool.withdraw()
 */
export function useWithdrawLiquidity() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isReceived } = useWaitForTransactionReceipt({ hash });

  const isReverted = isReceived && receipt?.status === 'reverted';
  const isSuccess = isReceived && receipt?.status === 'success';

  const withdraw = (amountEth: string) => {
    writeContract({
      address: CONTRACTS.POOL,
      abi: LIQUIDITY_POOL_ABI,
      functionName: 'withdraw',
      args: [parseEther(amountEth)],
    });
  };

  return { withdraw, hash, isPending, isConfirming, isSuccess, isReverted, error, reset };
}

/**
 * Hook for batch redeeming tokens via ClimProtocol.batchRedeemTokens()
 */
export function useBatchRedeem() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isReceived } = useWaitForTransactionReceipt({ hash });

  const isReverted = isReceived && receipt?.status === 'reverted';
  const isSuccess = isReceived && receipt?.status === 'success';

  const redeem = (eventIds: bigint[]) => {
    writeContract({
      address: CONTRACTS.PROTOCOL,
      abi: CLIM_PROTOCOL_ABI,
      functionName: 'batchRedeemTokens',
      args: [eventIds],
    });
  };

  return { redeem, hash, isPending, isConfirming, isSuccess, isReverted, error, reset };
}

/**
 * Hook for creating a new climate event via ClimateEventFactory.createClimateEvent()
 */
export function useCreateEvent() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isReceived } = useWaitForTransactionReceipt({ hash });

  // A tx can be mined but reverted on-chain
  const isReverted = isReceived && receipt?.status === 'reverted';
  const isSuccess = isReceived && receipt?.status === 'success';

  const createEvent = (params: {
    latitude: number;
    longitude: number;
    startTime: number;
    endTime: number;
    thresholdMm: number;
    payoutPerToken: string; // ETH string
    tokensToCreate: number;
  }) => {
    writeContract({
      address: CONTRACTS.FACTORY,
      abi: CLIMATE_EVENT_FACTORY_ABI,
      functionName: 'createClimateEvent',
      args: [
        BigInt(Math.round(params.latitude * 1e6)),
        BigInt(Math.round(params.longitude * 1e6)),
        BigInt(params.startTime),
        BigInt(params.endTime),
        BigInt(params.thresholdMm),
        parseEther(params.payoutPerToken),
        BigInt(params.tokensToCreate),
      ],
      gas: BigInt(5_000_000),
    });
  };

  return { createEvent, hash, isPending, isConfirming, isSuccess, isReverted, error, reset };
}

/**
 * Hook for manually settling an event via SettlementEngine.manualSettlement()
 */
export function useManualSettlement() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isReceived } = useWaitForTransactionReceipt({ hash });

  const isReverted = isReceived && receipt?.status === 'reverted';
  const isSuccess = isReceived && receipt?.status === 'success';

  const settle = (eventId: bigint) => {
    writeContract({
      address: CONTRACTS.SETTLEMENT,
      abi: SETTLEMENT_ENGINE_ABI,
      functionName: 'manualSettlement',
      args: [eventId],
    });
  };

  return { settle, hash, isPending, isConfirming, isSuccess, isReverted, error, reset };
}
