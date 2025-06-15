'use client';

import { useEffect, useRef, useState } from 'react';
import { FaEthereum } from "react-icons/fa";

import { toast } from 'sonner';
import {
  Address,
  createPublicClient,
  formatUnits,
  http
} from 'viem';
import { base } from 'viem/chains';
import { useAccount } from 'wagmi';

import { PUBLIC_RPC_URL } from '~/configs/env';
import { clearLocalStorage } from '~/utils/tokenUtils';
import { TARGET_TOKENS } from '../configs/constants';
import { logError } from '../lib/logger';
import { useSweep } from '../lib/useSweep';
import { useTokenRefresh } from '../lib/useTokenRefresh';
import { useTokenSelection } from '../lib/useTokenSelection';
import { useTotalValue } from '../lib/useTotalValue';
import {
  type TipConfig,
  type TokenInfo,
  type TokenSymbol,
} from '../types/index';
import { usePortfolio } from './providers/PortfolioProvider';

import { formatUsd } from './../utils/formatUtils';
import ActionButtons from './ActionButtons';
import NavBar from './NavBar';
import SwapConfirmationModal from './SwapConfirmationModal';
import TipModal from './TipModal';
import TokenHoldings from './TokenHoldings';
import TokenSelector from './TokenSelector';
import { InlineToast } from './ui/InlineToast';

/* ---------------------------------------------------------------------- */
/* Minimal Chainlink ETH/USD feed (Base mainnet)                           */
/* ---------------------------------------------------------------------- */
const ETH_USD_FEED: Address = '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70'; // Standard proxy
const FEED_ABI = [
  {
    name: 'latestAnswer',
    outputs: [{ type: 'int256' }],
    inputs: [],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface WalletSweepProps {
  onReady?: () => void;
}

export default function WalletSweep({ onReady }: WalletSweepProps) {
  /* ------------------------------------------------------------------ */
  /* State / hooks                                                      */
  /* ------------------------------------------------------------------ */
  const {
    loading: tokensLoading,
    significantTokens,
    refreshBalances,
  } = usePortfolio();

  const { isConnected, address } = useAccount();
  const readyCalled = useRef(false);

  const [targetToken, setTargetToken] = useState<TokenSymbol>('ETH');
  const [sweepPct, setSweepPct] = useState<number>(100);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipConfig, setTipConfig] = useState<TipConfig>({
    amount: '0.5',
    currency: 'USDC',
  });

  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [ethBalance, setEthBalance] = useState<bigint | null>(null);

  const prevAddress = useRef<string | undefined>(undefined);

  const {
    refreshing,
    refreshKey,
    handleRefresh,
  } = useTokenRefresh(refreshBalances);

  const {
    sweep,
    isLoading: sweepLoading,
    error: sweepError,
    swapStatus,
  } = useSweep(handleRefresh);


  const filteredTokens = significantTokens.filter(
    (t) => t.symbol !== targetToken,
  );

  const {
    selectedTokens,
    toggleToken,
    toggleAll,
    clearSelection,
    isAllSelected,
  } = useTokenSelection(filteredTokens);

  const validSelectedTokens = selectedTokens.filter(
    (t) => t.symbol !== targetToken,
  );


  const { pricesLoaded, handlePricesUpdate, getTotalValue } = useTotalValue();

  const publicClient = createPublicClient({
    chain: base,
    transport: http(PUBLIC_RPC_URL),
  });

  useEffect(() => {
    (async () => {
      try {
        const [answer, balance] = await Promise.all([
          publicClient.readContract({ address: ETH_USD_FEED, abi: FEED_ABI, functionName: 'latestAnswer' }),
          address ? publicClient.getBalance({ address }) : 0n,
        ]);
        const price = Number(answer) / 1e8;
        if (price > 0) setEthPrice(price);
        setEthBalance(balance);
      } catch (e) {
        console.error('Failed to fetch ETH price/balance', e);
      }
    })();
  }, [publicClient, address, refreshKey]);


  useEffect(() => {
    if (
      onReady &&
      isConnected &&
      !tokensLoading &&
      pricesLoaded &&
      !readyCalled.current
    ) {
      readyCalled.current = true;
      onReady();
    }
  }, [onReady, isConnected, tokensLoading, pricesLoaded]);

  useEffect(() => {
    if (sweepError) toast.error(sweepError);
  }, [sweepError]);

  useEffect(() => {
    if (!address) {
      clearLocalStorage();
      prevAddress.current = undefined;
      return;
    }
    if (address !== prevAddress.current) {
      clearLocalStorage();
      refreshBalances();
      prevAddress.current = address;
    }
  }, [address, refreshBalances]);


  const calcRawAmount = (t: TokenInfo): bigint =>
    (t.bigIntAmount * BigInt(sweepPct)) / 100n;

  const calcUiAmount = (raw: bigint, decimals: number): string =>
    formatUnits(raw, decimals);

  /* ------------------------------------------------------------------ */
  /* Actions                                                            */
  /* ------------------------------------------------------------------ */
  const handleSweep = async () => {
    if (!selectedTokens.length) return;
    setShowConfirmation(true);

    const rawAmounts = selectedTokens.map(calcRawAmount);
    const uiAmounts = selectedTokens.map((t, idx) =>
      calcUiAmount(rawAmounts[idx], t.decimals),
    );

    const tokenAddresses = selectedTokens.map((t) => t.contractAddress);

    const targetAddress = TARGET_TOKENS.find(
      (t) => t.symbol === targetToken,
    )?.address;
    if (!targetAddress) {
      logError('Invalid target token');
      return;
    }

    try {
      await sweep(tokenAddresses, targetAddress, uiAmounts, rawAmounts);
      clearSelection();
    } catch (err) {
      logError('Sweep failed:', err);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Derived values for UI                                              */
  /* ------------------------------------------------------------------ */
  const totalSweepUsd = (getTotalValue(selectedTokens) * sweepPct) / 100;
  const ethBalNumber = ethBalance ? Number(formatUnits(ethBalance, 18)) : undefined;
  const ethBalUsd = ethPrice && ethBalNumber !== undefined ? ethBalNumber * ethPrice : undefined;

  const portfolioUsd = getTotalValue(significantTokens) + (ethBalUsd ?? 0);
  const portfolioEth = ethPrice ? portfolioUsd / ethPrice : undefined;
  

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="w-full min-h-screen bg-[#1A1523] flex flex-col items-center py-0">
      <div className="w-full max-w-xl px-4">
        {/* NAVBAR + global refresh */}
        <NavBar onRefresh={handleRefresh} isRefreshing={refreshing} />
        {(portfolioEth !== undefined && ethBalNumber !== undefined) && (
          <div className="flex justify-between text-xs text-[#B8B4D8] mb-2 space-y-0.5">
            <div className="text-left flex items-center">
              Holdings ≈ {portfolioEth.toFixed(4)} <FaEthereum className="inline-block mr-1"/> | ${formatUsd(portfolioUsd)}
            </div>
            <div className="text-right flex items-center">
             ETH: {ethBalNumber.toFixed(4)} <FaEthereum className="inline-block mr-0.3"/>
            </div>
          </div>
        )}
        {/* MAIN CARD */}
        <div className="bg-[#221B2F] p-6 rounded-2xl border border-[#32275A] w-full shadow-lg">
                 {/* Minimalistic portfolio ETH line */}


          <div className="space-y-4">
            {/* TARGET TOKEN SELECTOR */}
            <TokenSelector
              selectedToken={targetToken}
              onSelectToken={setTargetToken}
            />

            {/* GLOBAL PERCENTAGE SLIDER -------------------------------- */}
            <div className="w-full space-y-2">
              <label
                htmlFor="sweepPct"
                className="text-sm font-medium text-[#B8B4D8]"
              >
                Sweep percentage&nbsp;
                <span className="font-bold text-white">{sweepPct}%</span>
              </label>

              <div className="relative h-2 w-full">
                {/* track */}
                <div className="absolute inset-y-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-full bg-[#32275A]" />

                {/* thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{
                    left: `calc(${sweepPct}% - 0.5rem)`,
                  }}
                >
                  <div
                    className="h-3.5 w-3.5 rounded-sm bg-[#9F7AEA] shadow-md border border-white transition-transform duration-300 ease-linear"
                    style={{
                      transform: `rotate(${45 + sweepPct * 0.9}deg)`,
                    }}
                  />
                </div>

                {/* invisible range input */}
                <input
                  id="sweepPct"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={sweepPct}
                  onChange={(e) => setSweepPct(Number(e.target.value))}
                  className="absolute inset-0 h-8 w-full cursor-pointer opacity-0"
                />
              </div>
            </div>

            {/* TOKEN BALANCES HEADER + SELECT/UNSELECT */}
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-white">
                Token Balances
              </h3>
              <button
                type="button"
                onClick={toggleAll}
                className="px-2 py-1 rounded-md text-[#9F7AEA] border border-transparent hover:border-[#9F7AEA] text-xs font-medium transition-colors focus:outline-none"
              >
                {isAllSelected ? 'Unselect All' : 'Select All'}
              </button>
            </div>

            {/* TOKEN LIST */}
            <TokenHoldings
              key={refreshKey}
              selectedTokens={selectedTokens}
              onToggleToken={toggleToken}
              onPricesUpdate={handlePricesUpdate}
              tokens={significantTokens}
              targetToken={targetToken}
            />

            {/* TOTAL VALUE (AFTER % APPLIED) */}
            <div className="my-2">
              <hr className="border-[#32275A] mb-2" />
              <div className="flex justify-between items-center">
                <span className="text-white text-base font-bold">
                  Total to sweep: ${totalSweepUsd.toFixed(2)}
                </span>
              </div>
            </div>

            {/* ACTIONS */}
            <ActionButtons
              onSweep={handleSweep}
              onTip={() => setShowTipModal(true)}
              isLoading={sweepLoading}
              selectedTokensCount={validSelectedTokens.length}
              targetToken={targetToken}
              isTargetTokenSelected={selectedTokens.some(
                (t) => t.symbol === targetToken,
              )}
              disableSweep={totalSweepUsd === 0}
            />

            {sweepError && (
              <div className="mt-2">
                <InlineToast type="error" message={sweepError} />
              </div>
            )}

            {/* TIP MODAL */}
            <TipModal
              open={showTipModal}
              onClose={() => setShowTipModal(false)}
              onSend={(amount, currency) =>
                setTipConfig({ amount, currency })
              }
              initialAmount={tipConfig.amount}
              initialCurrency={tipConfig.currency}
            />
          </div>
        </div>
      </div>

      {/* SWAP CONFIRMATION */}
      <SwapConfirmationModal show={showConfirmation} swapStatus={swapStatus} />
    </div>
  );
}
