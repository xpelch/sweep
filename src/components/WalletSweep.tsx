'use client';

import { useEffect, useRef, useState } from "react";
import { toast } from 'sonner';
import { useAccount } from "wagmi";
import { TARGET_TOKENS } from "../configs/constants";
import { logError } from "../lib/logger";
import { useSweep } from "../lib/useSweep";
import { useTokenRefresh } from "../lib/useTokenRefresh";
import { useTokenSelection } from "../lib/useTokenSelection";
import { useTotalValue } from "../lib/useTotalValue";
import { type TipConfig, type TokenSymbol } from "../types/index";
import ActionButtons from "./ActionButtons";
import NavBar from "./NavBar";
import { usePortfolio } from "./providers/PortfolioProvider";
import SwapConfirmationModal from "./SwapConfirmationModal";
import TipModal from "./TipModal";
import TokenHoldings from "./TokenHoldings";
import TokenSelector from "./TokenSelector";
import { InlineToast } from "./ui/InlineToast";

interface WalletSweepProps {
  onReady?: () => void;
}

export default function WalletSweep({ onReady }: WalletSweepProps) {
  const {
    loading: tokensLoading,
    significantTokens,
    refreshBalances,
  } = usePortfolio();

  const { isConnected, address } = useAccount();
  const readyCalled = useRef(false);
  const [targetToken, setTargetToken] = useState<TokenSymbol>("ETH");
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipConfig, setTipConfig] = useState<TipConfig>({
    amount: "0.5",
    currency: "USDC",
  });

  const { refreshing, refreshKey, handleRefresh, handleUIRefresh } = useTokenRefresh(refreshBalances);

  const { sweep, isLoading: sweepLoading, error: sweepError, swapStatus } = useSweep(handleRefresh, handleUIRefresh);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const filteredTokens = significantTokens.filter(t => t.symbol !== targetToken);

  const {
    selectedTokens,
    toggleToken,
    toggleAll,
    clearSelection,
    isAllSelected,
  } = useTokenSelection(filteredTokens);

  const validSelectedTokens = selectedTokens.filter(t => t.symbol !== targetToken);

  useEffect(() => {
    const targetSelected = selectedTokens.some(t => t.symbol === targetToken);
    if (targetSelected) {
      const tokensToKeep = selectedTokens.filter(t => t.symbol !== targetToken);
      if (tokensToKeep.length === 0) {
        clearSelection();
      } else {
        const target = selectedTokens.find(t => t.symbol === targetToken);
        if (target) toggleToken(target);
      }
    }
    // eslint-disable-next-line
  }, [targetToken]);

  const { pricesLoaded, handlePricesUpdate, getTotalValue } = useTotalValue();

  const prevAddress = useRef<string | undefined>(undefined);

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
    if (sweepError) {
      toast.error(sweepError);
    }
  }, [sweepError]);

  useEffect(() => {
    if (address && address !== prevAddress.current) {
      refreshBalances();
      prevAddress.current = address;
    }
  }, [address, refreshBalances]);

  /* ---------- actions ---------- */

  const handleSweep = async () => {
    if (!selectedTokens.length) return;

    setShowConfirmation(true);

    const tokenAddresses = selectedTokens.map((t) => t.contractAddress);
    const amounts = selectedTokens.map((t) => t.balance);

    const targetAddress = TARGET_TOKENS.find((t) => t.symbol === targetToken)
      ?.address;
    if (!targetAddress) {
      logError("Invalid target token");
      return;
    }

    try {
      await sweep(tokenAddresses, targetAddress, amounts);
      clearSelection();
    } catch (err) {
      logError("Sweep failed:", err);
    }
  };

  const totalValue = getTotalValue(selectedTokens);

  const handleSendTip = (amount: string, currency: TokenSymbol) => {
    setTipConfig({ amount, currency });
  };

  /* ---------- render ---------- */

  return (
    <div className="w-full min-h-screen bg-[#1A1523] flex flex-col items-center py-0">
      <div className="w-full max-w-xl px-4">   
        <NavBar onRefresh={handleRefresh} isRefreshing={refreshing} />

        <div className="bg-[#221B2F] p-6 rounded-2xl border border-[#32275A] w-full shadow-lg">
          <div className="space-y-4">
            <TokenSelector
              selectedToken={targetToken}
              onSelectToken={setTargetToken}
            />

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">
                Token Balances
              </h3>
              <button
                type="button"
                onClick={toggleAll}
                className="px-2 py-1 rounded-md text-[#9F7AEA] border border-transparent hover:border-[#9F7AEA] text-xs font-medium transition-colors focus:outline-none"
              >
                {isAllSelected ? "Unselect All" : "Select All"}
              </button>
            </div>

            <TokenHoldings
              key={refreshKey}
              selectedTokens={selectedTokens}
              onToggleToken={toggleToken}
              onPricesUpdate={handlePricesUpdate}
              tokens={significantTokens}
              targetToken={targetToken}
            />

            <div className="my-2">
              <hr className="border-[#32275A] mb-2" />
              <div className="flex justify-between items-center">
                <span className="text-white text-base font-bold">
                  Total: ${totalValue.toFixed(2)}
                </span>
              </div>
            </div>

            <ActionButtons
              onSweep={handleSweep}
              onTip={() => setShowTipModal(true)}
              isLoading={sweepLoading}
              selectedTokensCount={validSelectedTokens.length}
              targetToken={targetToken}
              isTargetTokenSelected={selectedTokens.some(t => t.symbol === targetToken)}
            />

            {sweepError && (
              <div className="mt-2">
                <InlineToast type="error" message={sweepError} />
              </div>
            )}

            <TipModal
              open={showTipModal}
              onClose={() => setShowTipModal(false)}
              onSend={handleSendTip}
              initialAmount={tipConfig.amount}
              initialCurrency={tipConfig.currency}
            />
          </div>
        </div>
      </div>

      <SwapConfirmationModal show={showConfirmation} swapStatus={swapStatus} />
    </div>
  );
}
