'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Wallets',
      wallets: [metaMaskWallet, walletConnectWallet, coinbaseWallet, rainbowWallet],
    },
  ],
  {
    appName: 'Clim Protocol',
    projectId,
  },
);

export const config = createConfig({
  connectors,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(rpcUrl, {
      batch: true,
    }),
  },
  ssr: true,
});

// Increase EventEmitter limit to prevent MaxListenersExceededWarning
// caused by many useWaitForTransactionReceipt hooks across components
if (typeof globalThis !== 'undefined' && typeof globalThis.process !== 'undefined') {
  try { globalThis.process.setMaxListeners?.(20); } catch { /* noop */ }
}
