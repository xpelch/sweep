import { TokenBalance } from "alchemy-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPublicClient, erc20Abi, http } from "viem";
import { base } from "viem/chains";
import { useAccount } from "wagmi";
import { PUBLIC_RPC_URL } from "~/configs/env";
import { isSignificantHolding, isTokenBlacklisted } from "../utils/tokenUtils";

const client = createPublicClient({
  chain: base,
  transport: http(PUBLIC_RPC_URL!), // ou ton endpoint RPC public
});

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

// --- Price cache helpers ---
function cacheTokenPrices(prices: Record<string, number>) {
  try {
    localStorage.setItem('cachedTokenPrices', JSON.stringify({ prices, timestamp: Date.now() }));
  } catch {}
}

function getCachedTokenPrices(): { prices: Record<string, number>; timestamp: number } | null {
  try {
    const raw = localStorage.getItem('cachedTokenPrices');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fetchTokenPricesByAddress(tokens: TokenInfo[]) {
  const cache = getCachedTokenPrices();
  const now = Date.now();

  // Use cached prices if less than 5 min old
  if (cache && now - cache.timestamp < 300_000) {
    return cache.prices;
  }

  const filtered = tokens.filter((t) => t.balance !== '0' && t.symbol && t.name);
  const batches = chunkArray(filtered, 25);

  // Récupération concurrente des prix pour chaque batch
  const responses = await Promise.all(
    batches.map(async (batch) => {
      const addresses = batch.map(({ contractAddress }) => ({
        network: 'base-mainnet',
        address: contractAddress,
      }));
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses }),
      });
      return (await res.json()).data as Array<{
        address: string;
        prices?: { currency: string; value: string }[];
      }>;
    }),
  );

  // Fusion des résultats + construction de la map {address → price}
  const priceMap: Record<string, number> = {};
  responses.flat().forEach((entry) => {
    const usd = entry.prices?.find((p) => p.currency === 'usd')?.value;
    if (usd) priceMap[entry.address.toLowerCase()] = parseFloat(usd);
  });

  cacheTokenPrices(priceMap);
  return priceMap;
}

function cachePortfolioData(data: PortfolioData) {
  try {
    localStorage.setItem('cachedPortfolioData', JSON.stringify(data));
  } catch {}
}

const defaultPortfolioData: PortfolioData = {
  tokens: [],
  prices: {},
  significantTokens: [],
  loading: false,
  error: null,
  lastUpdateTime: 0,
};

export function useAlchemyPortfolio() {
  const { address, isConnected } = useAccount();
  const [useSignificanceFilter, setUseSignificanceFilter] = useState(true);
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(defaultPortfolioData);

  const hasLoadedCache = useRef(false);

  useEffect(() => {
    if (hasLoadedCache.current) return;          // 1 seule fois
    try {
      const raw = localStorage.getItem('cachedPortfolioData');
      if (raw) {
        const cached = JSON.parse(raw) as PortfolioData;
        if (Date.now() - cached.lastUpdateTime < 300_000) {
          setPortfolioData(cached);              // ✅ setState après mount
        }
      }
    } catch {/* ignore JSON errors */}
    hasLoadedCache.current = true;
  }, []);

  const fetchPortfolio = useCallback(async () => {
    if (!address || !isConnected) {
      setPortfolioData(prev => ({ ...prev, tokens: [], significantTokens: [] }));
      return;
    }

    setPortfolioData(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Fetch token balances via API route (server-side, clé privée safe)
      const res = await fetch('/api/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const { tokenBalances } = await res.json();

      // Filter out tokens with zero balance
      const nonZero = tokenBalances.filter((t: TokenBalance) => BigInt(t.tokenBalance || '0') !== 0n);

      // Fetch metadata for each token
      const tokensWithMeta: TokenInfo[] = await fetchTokenMetadatas(
        nonZero.map((t: TokenBalance) => t.contractAddress)
      );

      for (const t of tokensWithMeta) {
        const bal = nonZero.find((b: TokenBalance) => b.contractAddress.toLowerCase() === t.contractAddress.toLowerCase());
        t.balance = bal ? (Number(bal.tokenBalance) / Math.pow(10, t.decimals)).toString() : "0";
      }

      const validTokens = tokensWithMeta.filter(t => t.symbol && t.name);

      console.log('validTokens', validTokens.length);
      const priceMap = await fetchTokenPricesByAddress(validTokens);

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

  async function fetchTokenMetadatas(addresses: string[]) {
    const batchSize = 50;
    const chunkArray = <T,>(arr: T[], size: number) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
      );
  
    const addressChunks = chunkArray(addresses, batchSize);
    const metadatas: TokenInfo[] = [];
  
    for (const chunk of addressChunks) {
      const calls = chunk.flatMap((address) => [
        { address: address as `0x${string}`, abi: erc20Abi, functionName: 'name' as const },
        { address: address as `0x${string}`, abi: erc20Abi, functionName: 'symbol' as const },
        { address: address as `0x${string}`, abi: erc20Abi, functionName: 'decimals' as const },
      ]);
      const results = await client.multicall({ contracts: calls });
      for (let i = 0; i < chunk.length; i++) {
        const name = results[i * 3].result as string;
        const symbol = results[i * 3 + 1].result as string;
        const decimals = results[i * 3 + 2].result as number;
        metadatas.push({
          contractAddress: chunk[i],
          name,
          symbol,
          decimals,
          logo: null, // ou une logique custom si tu veux
          balance: "0", // à remplir plus tard
        });
      }
    }
    return metadatas;
  }

  return {
    ...portfolioData,
    sortedTokens,
    refreshBalances: fetchPortfolio, // always force refvalueA   useSignificanceFilter,
    setUseSignificanceFilter,
  };
}