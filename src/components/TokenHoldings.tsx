import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { TokenInfo } from '../lib/useAlchemyPortfolio';

interface TokenHoldingsProps {
  selectedTokens: TokenInfo[];
  onToggleToken: (token: TokenInfo) => void;
  onPricesUpdate?: (prices: Record<string, number>) => void;
  tokens: TokenInfo[];
  targetToken?: string;
}



const CACHE_KEY = 'cachedTokenPrices';

function readCachedPrices(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const { prices } = JSON.parse(raw);
    return prices ?? {};
  } catch {
    return {};
  }
}



export default function TokenHoldings({
  selectedTokens,
  onToggleToken,
  onPricesUpdate,
  tokens,
  targetToken,
}: TokenHoldingsProps) {
  const [prices, setPrices] = useState<Record<string, number>>({});

  
  useEffect(() => {
    const cached = readCachedPrices();
    setPrices(cached);
    onPricesUpdate?.(cached);
  }, [tokens, onPricesUpdate]);

  const selectedSet = useMemo(
    () => new Set(selectedTokens.map((t) => t.contractAddress)),
    [selectedTokens],
  );

  if (!tokens.length)
    return <div className="text-[#b8b4d8]">No tokens found.</div>;

  return (
    <div className="flex flex-col gap-1 max-h-56 overflow-y-auto mt-2 px-1">
      {tokens.map((token) => {
        const isSelected = selectedSet.has(token.contractAddress);
        const isTarget = targetToken === token.symbol;
        const price = prices[token.contractAddress.toLowerCase()];
        const usdValue =
          price !== undefined
            ? (Number(token.amount) * price).toFixed(2)
            : '--';

        return (
          <button
            key={token.contractAddress}
            onClick={() => onToggleToken(token)}
            disabled={isTarget}
            type="button"
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg border transition-colors bg-[#2B2340]
              ${
                isSelected
                  ? 'border-[#9F7AEA] shadow-[0_0_6px_2px_rgba(159,122,234,0.15)]'
                  : 'border-[#32275A] hover:bg-[#32275A]'
              }
              ${isTarget ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
    
            <div className="flex items-center gap-3">
              {token.logo ? (
                <Image
                  src={token.logo}
                  alt={token.symbol}
                  width={36}
                  height={36}
                  unoptimized
                  className="rounded-full border-2 border-[#9F7AEA] bg-white object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border-2 border-[#9F7AEA] text-[#9F7AEA] font-bold">
                  {token.symbol[0]}
                </div>
              )}

              <div className="text-start">
                <div
                  className="text-white font-semibold text-sm truncate max-w-[96px]"
                  title={token.name ?? token.symbol}
                >
                  {token.name ?? token.symbol}
                </div>
                <div
                  className="text-xs text-[#B8B4D8] truncate max-w-[120px]"
                  title={`${Number(token.balance).toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })} ${token.symbol}`}
                >
                  {Number(token.balance).toLocaleString(undefined, {
                    maximumFractionDigits: 3,
                  })}{' '}
                  {token.symbol}
                </div>
              </div>
            </div>

    
            <span className="text-white font-bold text-sm min-w-[72px] text-right">
              ${usdValue}
            </span>
          </button>
        );
      })}
    </div>
  );
}
