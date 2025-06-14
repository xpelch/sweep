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

export type TokenInfo = {
  contractAddress: string;
  symbol: string;
  name: string;
  logo: string | null;
  decimals: number;
  /** Raw balance straight from the chain (base units). */
  bigIntAmount: bigint;
  /** Human-readable balance (decimals already applied). */
  amount: string;
  /** Deprecated – kept for backward compatibility. */
  balance?: string;
};