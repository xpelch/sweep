import type { Address, Hex } from 'viem';

export type TokenSymbol = 'ETH' | 'USDC' | 'PRO';

export type TokenInfo = {
  contractAddress: string;
  symbol: string;
  name: string;
  logo: string | null;
  decimals: number;
  bigIntAmount: bigint;
  amount: string;
  balance?: string;
};

export type SwapQuote = {
  token: string;
  amount: bigint;
  allowanceTarget?: string;
  tx: {
    to: Address;
    data: Hex;
    value: bigint;
  };
};

export type SwapStatus = {
  status: 'idle' | 'confirming' | 'success' | 'error';
  error?: string;
  token?: string;
  processedTokens?: {
    address: string;
    amount: string;
    status: 'success' | 'skipped' | 'failed' | 'confirming';
    reason?: string;
    symbol?: string;
  }[];
};