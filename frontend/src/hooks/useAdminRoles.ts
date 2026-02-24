'use client';

import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/constants/contracts';
import { ACCESS_CONTROL_ABI } from '@/constants/abis/AccessControl';
import { keccak256, toBytes } from 'viem';

// Pre-computed role hashes (keccak256 of the role string)
const ROLES = {
  DEFAULT_ADMIN: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
  PROTOCOL_ADMIN: keccak256(toBytes('PROTOCOL_ADMIN_ROLE')),
  EVENT_CREATOR: keccak256(toBytes('EVENT_CREATOR_ROLE')),
  AUTOMATION: keccak256(toBytes('AUTOMATION_ROLE')),
} as const;

export { ROLES };

/** All admin-relevant role checks for the connected wallet */
export interface AdminRoles {
  /** true if wallet has DEFAULT_ADMIN_ROLE on any core contract */
  isDefaultAdmin: boolean;
  /** true if wallet has PROTOCOL_ADMIN_ROLE on ClimProtocol */
  isProtocolAdmin: boolean;
  /** true if wallet has EVENT_CREATOR_ROLE on ClimateEventFactory */
  isEventCreator: boolean;
  /** true if wallet has AUTOMATION_ROLE or DEFAULT_ADMIN_ROLE on SettlementEngine */
  isSettlementAdmin: boolean;
  /** true if the wallet has any admin role at all */
  isAnyAdmin: boolean;
  /** loading state */
  isLoading: boolean;
  /** connected address */
  address: `0x${string}` | undefined;
  /** refetch roles */
  refetch: () => void;
}

// Role check contract call descriptors
function buildContracts(address: `0x${string}`) {
  return [
    // 0: DEFAULT_ADMIN on ClimProtocol
    { address: CONTRACTS.PROTOCOL, abi: ACCESS_CONTROL_ABI, functionName: 'hasRole' as const, args: [ROLES.DEFAULT_ADMIN, address] },
    // 1: PROTOCOL_ADMIN on ClimProtocol
    { address: CONTRACTS.PROTOCOL, abi: ACCESS_CONTROL_ABI, functionName: 'hasRole' as const, args: [ROLES.PROTOCOL_ADMIN, address] },
    // 2: EVENT_CREATOR on Factory
    { address: CONTRACTS.FACTORY, abi: ACCESS_CONTROL_ABI, functionName: 'hasRole' as const, args: [ROLES.EVENT_CREATOR, address] },
    // 3: DEFAULT_ADMIN on Settlement
    { address: CONTRACTS.SETTLEMENT, abi: ACCESS_CONTROL_ABI, functionName: 'hasRole' as const, args: [ROLES.DEFAULT_ADMIN, address] },
    // 4: AUTOMATION on Settlement
    { address: CONTRACTS.SETTLEMENT, abi: ACCESS_CONTROL_ABI, functionName: 'hasRole' as const, args: [ROLES.AUTOMATION, address] },
    // 5: DEFAULT_ADMIN on Factory
    { address: CONTRACTS.FACTORY, abi: ACCESS_CONTROL_ABI, functionName: 'hasRole' as const, args: [ROLES.DEFAULT_ADMIN, address] },
    // 6: DEFAULT_ADMIN on Token
    { address: CONTRACTS.TOKEN, abi: ACCESS_CONTROL_ABI, functionName: 'hasRole' as const, args: [ROLES.DEFAULT_ADMIN, address] },
  ];
}

/**
 * Hook to check the connected wallet's admin roles across all protocol contracts.
 * Uses multicall with aggressive retry for slow RPCs.
 */
export function useAdminRoles(): AdminRoles {
  const { address, isConnected } = useAccount();

  const { data, isLoading, isError, refetch } = useReadContracts({
    contracts: address ? buildContracts(address) : [],
    query: {
      enabled: isConnected && !!address,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      staleTime: 30_000,
    },
  });

  // Helper: safely read boolean result from multicall
  const readBool = (idx: number): boolean => {
    const item = data?.[idx];
    if (!item) return false;
    // wagmi v2 multicall: each result has status 'success' | 'failure'
    if (item.status === 'success') return item.result as boolean;
    return false;
  };

  const isDefaultAdmin = readBool(0) || readBool(5) || readBool(6);
  const isProtocolAdmin = readBool(1);
  const isEventCreator = readBool(2);
  const isSettlementDefaultAdmin = readBool(3);
  const isSettlementAutomation = readBool(4);
  const isSettlementAdmin = isSettlementDefaultAdmin || isSettlementAutomation;

  const isAnyAdmin = isDefaultAdmin || isProtocolAdmin || isEventCreator || isSettlementAdmin;

  // Debug: log to console in dev
  if (typeof window !== 'undefined' && data && !isLoading) {
    console.log('[useAdminRoles] address:', address);
    console.log('[useAdminRoles] multicall results:', data?.map((d, i) => ({ i, status: d?.status, result: d?.result })));
    console.log('[useAdminRoles] roles:', { isDefaultAdmin, isProtocolAdmin, isEventCreator, isSettlementAdmin, isAnyAdmin });
  }

  return {
    isDefaultAdmin,
    isProtocolAdmin,
    isEventCreator,
    isSettlementAdmin,
    isAnyAdmin,
    isLoading: !isConnected ? false : (isLoading && !isError),
    address,
    refetch,
  };
}

/**
 * Hook to grant a role to a wallet address on a specific contract.
 */
export function useGrantRole() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const grant = (contractAddress: `0x${string}`, role: `0x${string}`, account: `0x${string}`) => {
    writeContract({
      address: contractAddress,
      abi: ACCESS_CONTROL_ABI,
      functionName: 'grantRole',
      args: [role, account],
    });
  };

  return { grant, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook to revoke a role from a wallet address on a specific contract.
 */
export function useRevokeRole() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const revoke = (contractAddress: `0x${string}`, role: `0x${string}`, account: `0x${string}`) => {
    writeContract({
      address: contractAddress,
      abi: ACCESS_CONTROL_ABI,
      functionName: 'revokeRole',
      args: [role, account],
    });
  };

  return { revoke, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook to check if a specific wallet has a specific role on a contract.
 */
export function useCheckRole(contractAddress: `0x${string}`, role: `0x${string}`, account: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContracts({
    contracts: account ? [
      {
        address: contractAddress,
        abi: ACCESS_CONTROL_ABI,
        functionName: 'hasRole',
        args: [role, account],
      },
    ] : [],
    query: {
      enabled: !!account,
    },
  });

  return {
    hasRole: (data?.[0]?.result as boolean) ?? false,
    isLoading,
    refetch,
  };
}
