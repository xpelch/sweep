import { createPublicClient, erc20Abi, http, type Address } from 'viem';
import { base } from 'viem/chains';
import { PUBLIC_RPC_URL } from '~/configs/env';
import { type TokenInfo } from '../types';

export function isTokenBlacklisted(address: string): boolean {
    const list = JSON.parse(localStorage.getItem('blacklistedTokens') || '[]');
    return list.includes(address);
}

export function blacklistToken(address: string): void {
    const list = JSON.parse(localStorage.getItem('blacklistedTokens') || '[]');
    if (!list.includes(address)) {
        list.push(address);
        localStorage.setItem('blacklistedTokens', JSON.stringify(list));
    }
}

export function clearLocalStorage(): void {
    localStorage.clear();
}

export function removeSignificantToken(contractAddress: string): void {
  try {
    const cached = localStorage.getItem("cachedPortfolioData");
    if (!cached) return;

    const parsed = JSON.parse(cached);

    if (!Array.isArray(parsed.significantTokens)) return;

    parsed.significantTokens = parsed.significantTokens.filter(
      (token: { contractAddress: string }) =>
        token.contractAddress.toLowerCase() !== contractAddress.toLowerCase()
    );

    localStorage.setItem("cachedPortfolioData", JSON.stringify(parsed));
  } catch (err) {
    console.error("Error removing token from significantTokens:", err);
  }
}


export function calculateTotalValue(tokens: TokenInfo[], prices: Record<string, number>): number {
    return tokens.reduce((sum, token) => {
        const price = prices[token.contractAddress?.toLowerCase()];
        if (!price) return sum;
        return sum + parseFloat(token.amount) * price;
    }, 0);
}

export function formatTokenAmount(amount: string, decimals: number): string {
    return (Number(amount) / Math.pow(10, decimals)).toString();
}

const MIN_HOLDING_PERCENTAGE = 0.00000000000000000000000000000001;

export async function isSignificantHolding(
    tokenAddress: Address,
    balance: bigint
): Promise<boolean> {
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http(PUBLIC_RPC_URL),
      });
        const totalSupply = await publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'totalSupply',
        });

        const balancePercentage = Number(balance) / Number(totalSupply);
        return balancePercentage >= MIN_HOLDING_PERCENTAGE;
    } catch (error) {
        console.error(`Error checking total supply for token ${tokenAddress}:`, error);
        return true;
    }
} 