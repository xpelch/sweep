import { TokenBalance } from "alchemy-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { base } from "viem/chains";
import { useAccount } from "wagmi";
import { PUBLIC_RPC_URL } from "~/configs/env";
import { isSignificantHolding, isTokenBlacklisted } from "../utils/tokenUtils";

const client = createPublicClient({
  chain: base,
  transport: http(PUBLIC_RPC_URL!),
});

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

interface PortfolioData {
  tokens: TokenInfo[];
  prices: Record<string, number>;
  significantTokens: TokenInfo[];
  loading: boolean;
  error: string | null;
  lastUpdateTime: number;
}

const defaultPortfolioData: PortfolioData = {
  tokens: [],
  prices: {},
  significantTokens: [],
  loading: false,
  error: null,
  lastUpdateTime: 0,
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

function cacheTokenPrices(prices: Record<string, number>) {
  try {
    localStorage.setItem(
      "cachedTokenPrices",
      JSON.stringify({ prices, timestamp: Date.now() }),
    );
  } catch {}
}

function getCachedTokenPrices():
  | { prices: Record<string, number>; timestamp: number }
  | null {
  try {
    const raw = localStorage.getItem("cachedTokenPrices");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function cachePortfolioData(data: PortfolioData) {
  try {
    localStorage.setItem("cachedPortfolioData", JSON.stringify(data));
  } catch {}
}

function loadCachedPortfolioData(): PortfolioData | null {
  try {
    const raw = localStorage.getItem("cachedPortfolioData");
    if (!raw) return null;
    return JSON.parse(raw) as PortfolioData;
  } catch {
    return null;
  }
}

async function fetchTokenMetadatas(addresses: string[]) {
  const batchSize = 50;
  const addressChunks = chunkArray(addresses, batchSize);
  const metadatas: TokenInfo[] = [];

  for (const chunk of addressChunks) {
    const calls = chunk.flatMap((addr) => [
      {
        address: addr as `0x${string}`,
        abi: erc20Abi,
        functionName: "name" as const,
      },
      {
        address: addr as `0x${string}`,
        abi: erc20Abi,
        functionName: "symbol" as const,
      },
      {
        address: addr as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals" as const,
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
        amount: "0",
        balance: "0",
      });
    }
  }
  return metadatas;
}

function nonZeroBalances(tokenBalances: TokenBalance[]) {
  return tokenBalances.filter(
    (t) => BigInt(t.tokenBalance || "0") !== 0n,
  );
}

function attachBalances(tokensWithMeta: TokenInfo[], balances: TokenBalance[]) {
  for (const t of tokensWithMeta) {
    const bal = balances.find(
      (b) =>
        b.contractAddress.toLowerCase() ===
        t.contractAddress.toLowerCase(),
    );
    const raw = BigInt(bal?.tokenBalance ?? "0");
    t.bigIntAmount = raw;
    t.amount = formatUnits(raw, t.decimals);
    t.balance = t.amount;
  }
  return tokensWithMeta;
}

function filterValidTokens(tokens: TokenInfo[]) {
  return tokens.filter((t) => t.symbol && t.name);
}

async function fetchTokenPricesByAddress(tokens: TokenInfo[]) {
  const cache = getCachedTokenPrices();
  const now = Date.now();
  if (cache && now - cache.timestamp < 300_000) return cache.prices;

  const filtered = tokens.filter((t) => t.amount !== "0" && t.symbol && t.name);
  const batches = chunkArray(filtered, 25);

  const responses = await Promise.all(
    batches.map(async (batch) => {
      const addresses = batch.map(({ contractAddress }) => ({
        network: "base-mainnet",
        address: contractAddress,
      }));
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    const usd = entry.prices?.find((p) => p.currency === "usd")?.value;
    if (usd) priceMap[entry.address.toLowerCase()] = parseFloat(usd);
  });

  cacheTokenPrices(priceMap);
  return priceMap;
}

function filterTokensByUsdValue(
  tokens: TokenInfo[],
  prices: Record<string, number>,
  minUsdValue = 0.01,
) {
  return tokens.filter((token) => {
    const price = prices[token.contractAddress.toLowerCase()] || 0;
    const value = parseFloat(token.amount) * price;
    return value >= minUsdValue;
  });
}

async function applySignificanceFilter(
  tokens: TokenInfo[],
  useSignificanceFilter: boolean,
) {
  const checks = await Promise.all(
    tokens.map(async (token) => {
      if (!useSignificanceFilter) return token;
      const ok = await isSignificantHolding(
        token.contractAddress as `0x${string}`,
        token.bigIntAmount,
      );
      return ok ? token : null;
    }),
  );
  return checks.filter(
    (t): t is TokenInfo => t !== null && !isTokenBlacklisted(t.contractAddress),
  );
}

function sortByUsdValue(
  tokens: TokenInfo[],
  prices: Record<string, number>,
) {
  return [...tokens].sort((a, b) => {
    const pa = prices[a.contractAddress.toLowerCase()] || 0;
    const pb = prices[b.contractAddress.toLowerCase()] || 0;
    const va = parseFloat(a.amount) * pa;
    const vb = parseFloat(b.amount) * pb;
    return vb - va;
  });
}

export function useAlchemyPortfolio() {
  const { address, isConnected } = useAccount();
  const [useSignificanceFilter, setUseSignificanceFilter] = useState(true);
  const [portfolioData, setPortfolioData] =
    useState<PortfolioData>(defaultPortfolioData);
  const hasLoadedCache = useRef(false);

  useEffect(() => {
    if (hasLoadedCache.current) return;
    const cached = loadCachedPortfolioData();
    if (cached && Date.now() - cached.lastUpdateTime < 300_000) {
      setPortfolioData(cached);
    }
    hasLoadedCache.current = true;
  }, []);

  const fetchPortfolio = useCallback(async () => {
    if (!address || !isConnected) {
      setPortfolioData((p) => ({ ...p, tokens: [], significantTokens: [] }));
      return;
    }

    setPortfolioData((p) => ({ ...p, loading: true, error: null }));

    try {
      const res = await fetch("/api/balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const { tokenBalances } = await res.json();

      const nonZero = nonZeroBalances(tokenBalances as TokenBalance[]);
      const tokensWithMeta = await fetchTokenMetadatas(
        nonZero.map((t: TokenBalance) => t.contractAddress),
      );
      attachBalances(tokensWithMeta, nonZero);

      const validTokens = filterValidTokens(tokensWithMeta);
      const priceMap = await fetchTokenPricesByAddress(validTokens);
      const valueFilteredTokens = filterTokensByUsdValue(
        validTokens,
        priceMap,
      );
      const filteredTokens = await applySignificanceFilter(
        valueFilteredTokens,
        useSignificanceFilter,
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
        error: e instanceof Error ? e.message : "Failed to fetch portfolio",
      }));
    }
  }, [address, isConnected, useSignificanceFilter]);

  const sortedTokens = useMemo(
    () => sortByUsdValue(portfolioData.significantTokens, portfolioData.prices),
    [portfolioData.significantTokens, portfolioData.prices],
  );

  return {
    ...portfolioData,
    sortedTokens,
    refreshBalances: fetchPortfolio,
    useSignificanceFilter,
    setUseSignificanceFilter,
  };
}
