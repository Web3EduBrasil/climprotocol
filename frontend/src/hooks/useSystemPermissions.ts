'use client';

import { useEffect } from 'react';
import { useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import { CONTRACTS } from '@/constants/contracts';
import { ACCESS_CONTROL_ABI } from '@/constants/abis/AccessControl';

/**
 * All inter-contract role hashes needed for the protocol to function.
 */
const ROLE_HASHES = {
  POOL_MANAGER: keccak256(toBytes('POOL_MANAGER_ROLE')),
  MINTER: keccak256(toBytes('MINTER_ROLE')),
  SETTLER: keccak256(toBytes('SETTLER_ROLE')),
  AUTOMATION: keccak256(toBytes('AUTOMATION_ROLE')),
  ORACLE_REQUESTER: keccak256(toBytes('ORACLE_REQUESTER_ROLE')),
} as const;

/**
 * Description of a required inter-contract permission.
 */
export interface PermissionCheck {
  /** Target contract that owns the role */
  contract: `0x${string}`;
  /** Human label for the target contract */
  contractLabel: string;
  /** The role hash */
  role: `0x${string}`;
  /** Human label for the role */
  roleLabel: string;
  /** The address that should have the role */
  grantee: `0x${string}`;
  /** Human label for the grantee */
  granteeLabel: string;
  /** Whether the permission is currently set */
  hasRole: boolean;
  /** Critical = protocol won't work without it */
  critical: boolean;
}

/**
 * Build the list of all required inter-contract permissions.
 * These must be granted by DEFAULT_ADMIN on each contract after deployment.
 */
function buildPermissionChecks(): Array<{
  contract: `0x${string}`;
  contractLabel: string;
  role: `0x${string}`;
  roleLabel: string;
  grantee: `0x${string}`;
  granteeLabel: string;
  critical: boolean;
}> {
  return [
    // Factory needs POOL_MANAGER_ROLE on LiquidityPool (to lock collateral)
    {
      contract: CONTRACTS.POOL,
      contractLabel: 'LiquidityPool',
      role: ROLE_HASHES.POOL_MANAGER,
      roleLabel: 'POOL_MANAGER_ROLE',
      grantee: CONTRACTS.FACTORY,
      granteeLabel: 'Factory',
      critical: true,
    },
    // Factory needs MINTER_ROLE on ClimateEventToken (to create events & mint tokens)
    {
      contract: CONTRACTS.TOKEN,
      contractLabel: 'ClimateEventToken',
      role: ROLE_HASHES.MINTER,
      roleLabel: 'MINTER_ROLE',
      grantee: CONTRACTS.FACTORY,
      granteeLabel: 'Factory',
      critical: true,
    },
    // Factory needs AUTOMATION_ROLE on SettlementEngine (to register events for settlement)
    {
      contract: CONTRACTS.SETTLEMENT,
      contractLabel: 'SettlementEngine',
      role: ROLE_HASHES.AUTOMATION,
      roleLabel: 'AUTOMATION_ROLE',
      grantee: CONTRACTS.FACTORY,
      granteeLabel: 'Factory',
      critical: true,
    },
    // SettlementEngine needs SETTLER_ROLE on ClimateEventToken (to settle events)
    {
      contract: CONTRACTS.TOKEN,
      contractLabel: 'ClimateEventToken',
      role: ROLE_HASHES.SETTLER,
      roleLabel: 'SETTLER_ROLE',
      grantee: CONTRACTS.SETTLEMENT,
      granteeLabel: 'SettlementEngine',
      critical: true,
    },
    // SettlementEngine needs POOL_MANAGER_ROLE on LiquidityPool (to release collateral)
    {
      contract: CONTRACTS.POOL,
      contractLabel: 'LiquidityPool',
      role: ROLE_HASHES.POOL_MANAGER,
      roleLabel: 'POOL_MANAGER_ROLE',
      grantee: CONTRACTS.SETTLEMENT,
      granteeLabel: 'SettlementEngine',
      critical: true,
    },
    // SettlementEngine needs ORACLE_REQUESTER_ROLE on ClimateOracle (to request climate data)
    {
      contract: CONTRACTS.ORACLE,
      contractLabel: 'ClimateOracle',
      role: ROLE_HASHES.ORACLE_REQUESTER,
      roleLabel: 'ORACLE_REQUESTER_ROLE',
      grantee: CONTRACTS.SETTLEMENT,
      granteeLabel: 'SettlementEngine',
      critical: false, // Oracle may not be fully set up yet
    },
  ];
}

/**
 * Hook to check and fix all inter-contract permissions required for the protocol.
 */
export function useSystemPermissions() {
  const checks = buildPermissionChecks();

  // Build multicall read contracts
  const contracts = checks.map((c) => ({
    address: c.contract,
    abi: ACCESS_CONTROL_ABI,
    functionName: 'hasRole' as const,
    args: [c.role, c.grantee],
  }));

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: {
      retry: 2,
      retryDelay: 2000,
      staleTime: 15_000,
    },
  });

  // Write hook for granting roles one at a time
  const { data: grantHash, writeContract, isPending: grantPending, error: grantError, reset: grantReset } = useWriteContract();
  const { isLoading: grantConfirming, isSuccess: grantSuccess } = useWaitForTransactionReceipt({ hash: grantHash });

  // Auto-refresh permission list when a grant succeeds
  useEffect(() => {
    if (grantSuccess) {
      const timer = setTimeout(() => {
        grantReset();
        refetch();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [grantSuccess, grantReset, refetch]);

  const grantPermission = (contract: `0x${string}`, role: `0x${string}`, grantee: `0x${string}`) => {
    writeContract({
      address: contract,
      abi: ACCESS_CONTROL_ABI,
      functionName: 'grantRole',
      args: [role, grantee],
    });
  };

  // Build permission status list
  const permissions: PermissionCheck[] = checks.map((c, i) => {
    const item = data?.[i];
    const hasRole = item?.status === 'success' ? (item.result as boolean) : false;
    return { ...c, hasRole };
  });

  const missingCritical = permissions.filter((p) => p.critical && !p.hasRole);
  const allCriticalSet = missingCritical.length === 0;

  return {
    permissions,
    missingCritical,
    allCriticalSet,
    isLoading,
    refetch,
    grantPermission,
    grantHash,
    grantPending,
    grantConfirming,
    grantSuccess,
    grantError,
    grantReset,
  };
}
