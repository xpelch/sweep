import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { RPC_URL } from "../configs/env";
import type { TokenInfo } from "../lib/useAlchemyPortfolio";

interface TokenHoldingsProps {
  selectedTokens: TokenInfo[];
  onToggleToken: (token: TokenInfo) => void;
  onPricesUpdate?: (prices: Record<string, number>) => void;
  tokens: TokenInfo[];
  targetToken?: string;
}

interface TokenPrice {
  currency: string;
  value: string;
}

interface TokenPriceResponse {
  address: string;
  prices: TokenPrice[];
}

interface TokenPricesResponse {
  data: TokenPriceResponse[];
}

/* ---------- utils internes ---------- */

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

async function fetchTokenPricesByAddress(tokens: TokenInfo[]) {
  const apiKey = RPC_URL.split("/").pop();
  const url = `https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/by-address`;

  const filtered = tokens.filter((t) => t.balance !== "0");
  const batches = chunkArray(filtered, 3);

  const priceMap: Record<string, number> = {};
  for (const batch of batches) {
    const addresses = batch.map((t) => ({
      network: "base-mainnet",
      address: t.contractAddress,
    }));
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresses }),
    });
    const data: TokenPricesResponse = await res.json();
    for (const entry of data.data) {
      const usd = entry.prices?.find((p: TokenPrice) => p.currency === "usd")?.value;
      if (usd) priceMap[entry.address.toLowerCase()] = parseFloat(usd);
    }
  }
  return priceMap;
}

/* ---------- composant ---------- */

export default function TokenHoldings({
  selectedTokens,
  onToggleToken,
  onPricesUpdate,
  tokens,
  targetToken,
}: TokenHoldingsProps) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  /* ← 1. on ajoute `tokens` dans les dépendances */
  const fetchPrices = useCallback(async () => {
    if (!tokens.length || isLoading) return;

    const now = Date.now();
    if (now - lastUpdateTime < 30_000) return;

    setIsLoading(true);
    try {
      const priceMap = await fetchTokenPricesByAddress(tokens);
      setPrices(priceMap);
      setLastUpdateTime(now);
      onPricesUpdate?.(priceMap);
    } catch (e) {
      console.error("Error fetching prices:", e);
    } finally {
      setIsLoading(false);
    }
  }, [tokens, onPricesUpdate, isLoading, lastUpdateTime]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  if (!tokens.length) return <div className="text-[#b8b4d8]">No tokens found.</div>;

  return (
    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mt-3 px-1">
      {tokens.map((token) => {
        const isSelected = selectedTokens.some(
          (t) => t.contractAddress === token.contractAddress,
        );
        const price = prices[token.contractAddress.toLowerCase()];
        const value = price ? (parseFloat(token.balance) * price).toFixed(2) : "--";
        const isTarget = targetToken && token.symbol === targetToken;

        return (
          <button
            key={token.contractAddress}
            onClick={() => onToggleToken(token)}
            type="button"
            disabled={!!isTarget}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-colors bg-[#2B2340] shadow-[0_2px_8px_0_rgba(50,39,90,0.10)]
              ${isSelected
                ? "border-[#9F7AEA] shadow-[0_0_6px_2px_rgba(159,122,234,0.15)]"
                : "border-[#32275A] hover:bg-[#32275A]"
              } ${isTarget ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-4">
              {token.logo ? (
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#9F7AEA] bg-white">
                  <Image
                    src={token.logo}
                    alt={token.symbol}
                    width={44}
                    height={44}
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center border-2 border-[#9F7AEA] text-[#9F7AEA] font-bold text-lg">
                  {token.symbol[0]}
                </div>
              )}
              <div className="text-left">
                <div className="text-white font-semibold leading-tight text-base max-w-[100px] truncate" title={token.name || token.symbol}>
                  {token.name || token.symbol}
                </div>
                <div
                  className="text-xs text-[#B8B4D8] max-w-[140px] truncate"
                  title={`${Number(token.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${token.symbol}`}
                >
                  {Number(token.balance).toLocaleString(undefined, { maximumFractionDigits: 3 })} {token.symbol}
                </div>
              </div>
            </div>
            <div className="text-right text-white font-bold text-lg min-w-[80px]">
              ${value}
            </div>
          </button>
        );
      })}
    </div>
  );
}
