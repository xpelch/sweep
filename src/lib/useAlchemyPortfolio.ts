import { TokenBalance } from "alchemy-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { isSignificantHolding, isTokenBlacklisted } from "../utils/tokenUtils";

export type TokenInfo = {
  contractAddress: string;
  symbol: string;
  name: string;
  logo: string | null;
  balance: string;
  decimals: number;
};

interface PortfolioData {
  tokens: TokenInfo[];
  prices: Record<string, number>;
  significantTokens: TokenInfo[];
  loading: boolean;
  error: string | null;
  lastUpdateTime: number;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

async function fetchTokenPricesByAddress(tokens: TokenInfo[]) {
  const filtered = tokens.filter((t) => t.balance !== '0' && t.symbol && t.name);
  const batches = chunkArray(filtered, 25);
  const priceMap: Record<string, number> = {};

  for (const batch of batches) {
    const addresses = batch.map((token) => ({
      network: 'base-mainnet',
      address: token.contractAddress,
    }));
    const res = await fetch('/api/alchemy/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses }),
    });
    const data = await res.json();
    for (const entry of data.data) {
      const usdPrice = entry.prices?.find(
        (p: { currency: string }) => p.currency === 'usd',
      )?.value;
      if (usdPrice) priceMap[entry.address.toLowerCase()] = parseFloat(usdPrice);
    }
  }
  return priceMap;
}

function cachePortfolioData(data: PortfolioData) {
  try {
    localStorage.setItem('cachedPortfolioData', JSON.stringify(data));
  } catch {}
}

function getCachedPortfolioData(): PortfolioData | null {
  try {
    const data = localStorage.getItem('cachedPortfolioData');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function useAlchemyPortfolio() {
  const { address, isConnected } = useAccount();
  const [useSignificanceFilter, setUseSignificanceFilter] = useState(true);
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(() => {
    return  {
      tokens: [],
      prices: {},
      significantTokens: [],
      loading: false,
      error: null,
      lastUpdateTime: 0,
    };
  });

  const fetchPortfolio = useCallback(async () => {
    if (!address || !isConnected) {
      setPortfolioData(prev => ({ ...prev, tokens: [], significantTokens: [] }));
      return;
    }

    setPortfolioData(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Fetch token balances via API route (server-side, clé privée safe)
      const res = await fetch('/api/alchemy/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const { tokenBalances } = await res.json();

      // Filter out tokens with zero balance
      const nonZero = tokenBalances.filter((t: TokenBalance) => BigInt(t.tokenBalance || '0') !== 0n);
      console.log('nonZero', nonZero);

      // Fetch metadata for each token
      const tokensWithMeta: TokenInfo[] = await Promise.all(
        nonZero.map(async (t: TokenBalance) => {
          const meta = await fetch(`https://base-mainnet.g.alchemy.com/v2/demo/getTokenMetadata?contractAddress=${t.contractAddress}`)
            .then(r => r.json());
          return {
            contractAddress: t.contractAddress,
            symbol: meta.symbol || "",
            name: meta.name || "",
            logo: meta.logo || null,
            balance: (Number(t.tokenBalance) / Math.pow(10, meta.decimals || 18)).toString(),
            decimals: meta.decimals || 18,
          };
        })
      );

      // Filter out tokens without symbol or name
      const validTokens = tokensWithMeta.filter(t => t.symbol && t.name);

      // Fetch prices and check significant holdings
      const priceMap = await fetchTokenPricesByAddress(validTokens);
      // Filter out tokens with value < $0.01
      const minUsdValue = 0.01;
      const valueFilteredTokens = validTokens.filter(token => {
        const price = priceMap[token.contractAddress.toLowerCase()] || 0;
        const value = parseFloat(token.balance) * price;
        return value >= minUsdValue;
      });
      const significant = await Promise.all(
        valueFilteredTokens.map(async (token) => {
          const price = priceMap[token.contractAddress.toLowerCase()];
          if (!price) return null;
          if (!useSignificanceFilter) return token;
          const balance = BigInt(Math.floor(parseFloat(token.balance) * Math.pow(10, token.decimals)));
          const isSignificant = await isSignificantHolding(token.contractAddress as `0x${string}`, balance);
          return isSignificant ? token : null;
        })
      );

      // Filter out blacklisted tokens and null values
      const filteredTokens = significant.filter((t): t is TokenInfo => 
        t !== null && !isTokenBlacklisted(t.contractAddress)
      );

      const newData = {
        tokens: valueFilteredTokens,
        prices: priceMap,
        significantTokens: filteredTokens,
        loading: false,
        error: null,
        lastUpdateTime: Date.now(),
      };

      setPortfolioData(newData);
      cachePortfolioData(newData);
    } catch (e) {
      setPortfolioData(prev => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to fetch portfolio",
      }));
    }
  }, [address, isConnected, useSignificanceFilter]);

  useEffect(() => {
    const cached = getCachedPortfolioData();
    const now = Date.now();
    
    if (cached && now - cached.lastUpdateTime < 300000) {
      setPortfolioData(cached);
    } else {
      fetchPortfolio(); // force refresh
    }
    // eslint-disable-next-line
  }, [address, isConnected, useSignificanceFilter]);

  const sortedTokens = useMemo(() => 
    portfolioData.significantTokens
      .sort((a, b) => {
        const priceA = portfolioData.prices[a.contractAddress.toLowerCase()] || 0;
        const priceB = portfolioData.prices[b.contractAddress.toLowerCase()] || 0;
        const valueA = parseFloat(a.balance) * priceA;
        const valueB = parseFloat(b.balance) * priceB;
        return valueB - valueA;
      }),
    [portfolioData.significantTokens, portfolioData.prices]
  );

  return {
    ...portfolioData,
    sortedTokens,
    refreshBalances: fetchPortfolio, // always force refvalueA   useSignificanceFilter,
    setUseSignificanceFilter,
  };
}