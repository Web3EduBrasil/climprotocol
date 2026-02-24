/** Extract a human-readable error from Ethereum/RPC errors */
export function parseContractError(err: Error | null): string {
  if (!err) return 'Transaction failed';
  const msg = err.message || '';
  // User rejected in wallet
  if (msg.includes('User rejected') || msg.includes('user rejected') || msg.includes('ACTION_REJECTED')) {
    return 'Transaction rejected by user in wallet';
  }
  // Gas limit too high
  if (msg.includes('gas limit too high')) {
    const match = msg.match(/cap:\s*(\d+).*?tx:\s*(\d+)/);
    return match ? `Gas limit too high (network cap: ${Number(match[1]).toLocaleString()}, requested: ${Number(match[2]).toLocaleString()})` : 'Gas limit exceeds network maximum';
  }
  // Revert reason
  const revertMatch = msg.match(/reason:\s*"?([^"\n]+)"?/) || msg.match(/reverted with reason string '([^']+)'/) || msg.match(/execution reverted:\s*(.+?)(?:\n|$)/);
  if (revertMatch) return `Contract reverted: ${revertMatch[1].trim()}`;
  // Insufficient funds
  if (msg.includes('insufficient funds')) return 'Insufficient ETH balance for this transaction';
  // Nonce issues
  if (msg.includes('nonce')) return 'Nonce conflict — try resetting your wallet activity';
  // Generic RPC
  const rpcMatch = msg.match(/"message":\s*"([^"]+)"/);
  if (rpcMatch) return rpcMatch[1];
  // Fallback: first 150 useful chars
  return msg.slice(0, 150) || 'Transaction failed';
}

/** Etherscan URL for Sepolia testnet */
export function etherscanTxUrl(hash: string): string {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}
