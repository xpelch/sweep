'use client';

import { useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';

import { clearLocalStorage } from '~/utils/tokenUtils';
import { TARGET_TOKENS } from '../configs/constants';
import { logError } from '../lib/logger';
import { useEthPriceAndBalance } from '../lib/useEthPriceAndBalance';
import { useSweep } from '../lib/useSweep';
import { useTokenRefresh } from '../lib/useTokenRefresh';
import { useTokenSelection } from '../lib/useTokenSelection';
import { useTotalValue } from '../lib/useTotalValue';
import { calcRawAmount, calcSweepUsd, calcUiAmount } from '../utils/sweepMath';
import { type TokenSymbol } from '~/types';
import { usePortfolio } from './providers/PortfolioProvider';

import ActionButtons from './ActionButtons';
import AddFrameButton from './AddFrameButton';
import { InlineToast } from './InlineToast';
import NavBar from './NavBar';
import PortfolioSummary from './PortfolioSummary';
import SwapConfirmationModal from './SwapConfirmationModal';
import SweepPercentageSlider from './SweepPercentageSlider';
import TokenBalancesHeader from './TokenBalancesHeader';
import TokenHoldings from './TokenHoldings';
import TokenSelector from './TokenSelector';
import TotalSweepValue from './TotalSweepValue';

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

  const [targetToken, setTargetToken] = useState<TokenSymbol>('ETH');
  const [sweepPct, setSweepPct] = useState<number>(100);

  const [showConfirmation, setShowConfirmation] = useState(false);

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

  const { ethPrice, ethBalance } = useEthPriceAndBalance(refreshKey);

  const filteredTokens = significantTokens.filter(
    (t) => t.symbol !== targetToken,
  );

  const {
    selectedTokens,
    toggleToken,
    toggleAll,
    clearSelection,
    isAllSelected,
  } = useTokenSelection(filteredTokens, targetToken);

  const validSelectedTokens = selectedTokens.filter(
    (t) => t.symbol !== targetToken,
  );

  const { pricesLoaded, handlePricesUpdate, getTotalValue } = useTotalValue();

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

  const handleSweep = async () => {
    if (!selectedTokens.length) return;
    setShowConfirmation(true);

    const rawAmounts = selectedTokens.map((t) => calcRawAmount(t, sweepPct));
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

  const totalSweepUsd = calcSweepUsd(getTotalValue(selectedTokens), sweepPct);
  const ethBalNumber = ethBalance ? Number(formatUnits(ethBalance, 18)) : undefined;
  const ethBalUsd = ethPrice && ethBalNumber !== undefined ? ethBalNumber * ethPrice : undefined;

  const portfolioUsd = getTotalValue(significantTokens) + (ethBalUsd ?? 0);
  const portfolioEth = ethPrice ? portfolioUsd / ethPrice : undefined;

  return (
    <div className="w-full min-h-screen bg-[#1A1523] flex flex-col items-center py-0">
      <div className="w-full max-w-xl px-4">

        <NavBar onRefresh={handleRefresh} isRefreshing={refreshing} />
        <PortfolioSummary
          portfolioEth={portfolioEth}
          portfolioUsd={portfolioUsd}
          ethBalNumber={ethBalNumber}
        />
        <AddFrameButton />
        <div className="bg-[#221B2F] p-6 rounded-2xl border border-[#32275A] w-full shadow-lg relative">
          <div className="space-y-2">
            <TokenSelector
              selectedToken={targetToken}
              onSelectToken={setTargetToken}
            />
            <SweepPercentageSlider sweepPct={sweepPct} setSweepPct={setSweepPct} />
            <TokenBalancesHeader isAllSelected={isAllSelected} toggleAll={toggleAll} />
            <TokenHoldings
              key={refreshKey}
              selectedTokens={selectedTokens}
              onToggleToken={toggleToken}
              onPricesUpdate={handlePricesUpdate}
              tokens={significantTokens}
              targetToken={targetToken}
            />
            <TotalSweepValue totalSweepUsd={totalSweepUsd} />
            <ActionButtons
              onSweep={handleSweep}
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
          </div>
        </div>
      </div>

      <SwapConfirmationModal show={showConfirmation} swapStatus={swapStatus} />
    </div>
  );
}