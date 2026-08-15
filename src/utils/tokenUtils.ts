import { type TokenInfo } from '~/types';

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