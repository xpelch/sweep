import type { Address, Hex } from 'viem';

export type SwapQuote = {
    token: string;
    amount: bigint;
    allowanceTarget?: string;
    tx: {
        to: `0x${string}`;
        data: `0x${string}`;
        value: bigint;
    };
};


/** EIP-712 payload returned by 0x for Permit2 signatures */
export interface Permit2Eip712 {
  types: Record<string, { name: string; type: string }[]>;
  domain: {
    name: string;
    chainId: number;
    verifyingContract: Address;
  };
  message: Record<string, unknown>;
  primaryType: string;
}

/** Full Permit2 section */
export interface Permit2Payload {
  /** Always `"Permit2"` */
  type: 'Permit2';
  /** Hash of the permit (useful for caching/validation) */
  hash: string;
  /** Typed-data you must sign with `signTypedData()` */
  eip712: Permit2Eip712;
}

/** Minimal transaction envelope sent back by 0x */
export interface ZeroExTransaction {
  to: Address;
  data: Hex;
  value?: string;     // may be "0"
  gas?: string;
  gasPrice?: string;
}

/**
 * Firm quote returned by `/swap/permit2/quote`
 * (only the fields we actually consume; the rest is indexed).
 */
export interface SwapQuotePermit2 {
  liquidityAvailable: boolean;
  blockNumber: string;
  buyToken: Address;
  buyAmount: string;
  sellToken: Address;
  sellAmount: string;
  gas: string;
  gasPrice: string;

  /** Pre-filled calldata to execute the swap */
  transaction: ZeroExTransaction;

  /** Permit2 payload to sign off-chain */
  permit2: Permit2Payload;

  /** Everything else (fees, route, issues, …) */
  [key: string]: unknown;
}

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