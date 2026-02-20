export const CONTRACTS = {
  TOKEN: process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`,
  POOL: process.env.NEXT_PUBLIC_POOL_ADDRESS as `0x${string}`,
  ORACLE: process.env.NEXT_PUBLIC_ORACLE_ADDRESS as `0x${string}`,
  SETTLEMENT: process.env.NEXT_PUBLIC_SETTLEMENT_ADDRESS as `0x${string}`,
  FACTORY: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
  PROTOCOL: process.env.NEXT_PUBLIC_PROTOCOL_ADDRESS as `0x${string}`,
};

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org';
