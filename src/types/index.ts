import { type Address } from 'viem';

export type TokenSymbol = 'ETH' | 'USDC' | 'PRO';

export interface TokenInfo {
    contractAddress: string;
    symbol: string;
    name: string;
    logo: string | null;
    balance: string;
    decimals: number;
}

export interface TargetToken {
    symbol: TokenSymbol;
    name: string;
    logo: string;
    address: string;
}

export interface SwapQuote {
    token: string;
    amount: bigint;
    allowanceTarget?: string;
    tx: {
        to: Address;
        data: string;
        value: bigint;
    };
}

export interface SwapStatus {
    status: 'idle' | 'confirming' | 'success' | 'error';
    error?: string;
}

export interface TipConfig {
    amount: string;
    currency: TokenSymbol;
} 