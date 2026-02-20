'use client';

import { SiChainlink } from 'react-icons/si';

export function ChainlinkBadge() {
  return (
    <a
      href="https://chain.link"
      target="_blank"
      rel="noopener noreferrer"
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2A5ADA]/10 border border-[#2A5ADA]/20 hover:bg-[#2A5ADA]/20 hover:border-[#2A5ADA]/30 transition-all duration-300 group"
    >
      <SiChainlink className="w-3.5 h-3.5 text-[#2A5ADA] group-hover:text-[#375BD2] transition-colors" />
      <span className="text-[10px] font-medium text-[#2A5ADA]/80 group-hover:text-[#2A5ADA] transition-colors whitespace-nowrap">
        Powered by Chainlink
      </span>
    </a>
  );
}

export function ChainlinkBadgeLarge() {
  return (
    <a
      href="https://chain.link"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2A5ADA]/10 border border-[#2A5ADA]/20 hover:bg-[#2A5ADA]/20 hover:border-[#2A5ADA]/30 transition-all duration-300 group glow-blue"
    >
      <SiChainlink className="w-5 h-5 text-[#2A5ADA] group-hover:text-[#375BD2] transition-colors" />
      <div className="text-left">
        <p className="text-xs font-semibold text-[#2A5ADA]">Powered by Chainlink</p>
        <p className="text-[10px] text-[#2A5ADA]/60">Functions · Automation · CCIP</p>
      </div>
    </a>
  );
}
