import { TokenBalance } from "alchemy-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
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
  decimals: number;

  /** Raw balance straight from the chain (base units). */
  bigIntAmount: bigint;

  /** Human-readable balance (decimals already applied). */
  amount: string;

  /** Deprecated – kept for backward compatibility. */
  balance?: string;
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

function cachePortfolioData(data: PortfolioData) {
  try {
    localStorage.setItem('cachedPortfolioData', JSON.stringify(data));
  } catch {}
}
async function fetchTokenPricesByAddress(tokens: TokenInfo[]) {
  const cache = getCachedTokenPrices();
  const now = Date.now();

  // Use cached prices if < 5 min old
  if (cache && now - cache.timestamp < 300_000) return cache.prices;

  const filtered = tokens.filter(
    (t) => t.amount !== '0' && t.symbol && t.name,
  );
  const batches = chunkArray(filtered, 25);

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

  const priceMap: Record<string, number> = {};
  responses.flat().forEach((entry) => {
    const usd = entry.prices?.find((p) => p.currency === 'usd')?.value;
    if (usd) priceMap[entry.address.toLowerCase()] = parseFloat(usd);
  });

  cacheTokenPrices(priceMap);
  return priceMap;
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
  const [portfolioData, setPortfolioData] =
    useState<PortfolioData>(defaultPortfolioData);
  const hasLoadedCache = useRef(false);

  // Restore cache once
  useEffect(() => {
    if (hasLoadedCache.current) return;
    try {
      const raw = localStorage.getItem('cachedPortfolioData');
      if (raw) {
        const cached = JSON.parse(raw) as PortfolioData;
        if (Date.now() - cached.lastUpdateTime < 300_000) {
          setPortfolioData(cached);
        }
      }
    } catch {}
    hasLoadedCache.current = true;
  }, []);

  /* ---------------------------- Fetch portfolio --------------------------- */
  const fetchPortfolio = useCallback(async () => {
    if (!address || !isConnected) {
      setPortfolioData((p) => ({ ...p, tokens: [], significantTokens: [] }));
      return;
    }

    setPortfolioData((p) => ({ ...p, loading: true, error: null }));

    try {
      // Fetch balances via server-side API (keeps private key safe)
      const res = await fetch('/api/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const { tokenBalances } = await res.json();

      // Keep only non-zero balances
      const nonZero = tokenBalances.filter(
        (t: TokenBalance) => BigInt(t.tokenBalance || '0') !== 0n,
      );

      // Fetch ERC-20 metadata
      const tokensWithMeta = await fetchTokenMetadatas(
        nonZero.map((t: TokenBalance) => t.contractAddress),
      );

      // Attach balance info
      for (const t of tokensWithMeta) {
        const bal = nonZero.find(
          (b: TokenBalance) =>
            b.contractAddress.toLowerCase() === t.contractAddress.toLowerCase(),
        );
        const raw = BigInt(bal?.tokenBalance ?? '0');
        t.bigIntAmount = raw;
        t.amount = formatUnits(raw, t.decimals);
        t.balance = t.amount; // legacy field
      }

      const validTokens = tokensWithMeta.filter((t) => t.symbol && t.name);
      const priceMap = await fetchTokenPricesByAddress(validTokens);

      // Min value filter (USD)
      const minUsdValue = 0.01;
      const valueFilteredTokens = validTokens.filter((token) => {
        const price = priceMap[token.contractAddress.toLowerCase()] || 0;
        const value = parseFloat(token.amount) * price;
        return value >= minUsdValue;
      });

      // Significance filter (on-chain heuristic)
      const significant = await Promise.all(
        valueFilteredTokens.map(async (token) => {
          if (!useSignificanceFilter) return token;
          const isSig = await isSignificantHolding(
            token.contractAddress as `0x${string}`,
            token.bigIntAmount,
          );
          return isSig ? token : null;
        }),
      );

      // Remove blacklisted + null
      const filteredTokens = significant.filter(
        (t): t is TokenInfo =>
          t !== null && !isTokenBlacklisted(t.contractAddress),
      );

      const newData: PortfolioData = {
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
      setPortfolioData((p) => ({
        ...p,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to fetch portfolio',
      }));
    }
  }, [address, isConnected, useSignificanceFilter]);

  /* ------------------------------ Sorting --------------------------------- */
  const sortedTokens = useMemo(
    () =>
      portfolioData.significantTokens.sort((a, b) => {
        const priceA = portfolioData.prices[a.contractAddress.toLowerCase()] || 0;
        const priceB = portfolioData.prices[b.contractAddress.toLowerCase()] || 0;
        const valueA = parseFloat(a.amount) * priceA;
        const valueB = parseFloat(b.amount) * priceB;
        return valueB - valueA;
      }),
    [portfolioData.significantTokens, portfolioData.prices],
  );

  /* --------------------------- Meta fetcher ------------------------------- */
  async function fetchTokenMetadatas(addresses: string[]) {
    const batchSize = 50;
    const addressChunks = chunkArray(addresses, batchSize);
    const metadatas: TokenInfo[] = [];

    for (const chunk of addressChunks) {
      const calls = chunk.flatMap((addr) => [
        {
          address: addr as `0x${string}`,
          abi: erc20Abi,
          functionName: 'name' as const,
        },
        {
          address: addr as `0x${string}`,
          abi: erc20Abi,
          functionName: 'symbol' as const,
        },
        {
          address: addr as `0x${string}`,
          abi: erc20Abi,
          functionName: 'decimals' as const,
        },
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
          logo: null,
          bigIntAmount: 0n,
          amount: '0',
          balance: '0',
        });
      }
    }
    return metadatas;
  }

  return {
    ...portfolioData,
    sortedTokens,
    refreshBalances: fetchPortfolio,
    useSignificanceFilter,
    setUseSignificanceFilter,
  };
}