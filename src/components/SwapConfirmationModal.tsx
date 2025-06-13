import { useEffect, useRef, useState } from 'react';
import { RiErrorWarningFill } from 'react-icons/ri';
import { usePortfolio } from '~/lib/PortfolioProvider';
import { type SwapStatus } from '../types';

interface SwapConfirmationModalProps {
  show: boolean;
  swapStatus: SwapStatus;
  onClose?: () => void;
}

type ProcessedToken = NonNullable<SwapStatus['processedTokens']>[number];

export default function SwapConfirmationModal({
  show,
  swapStatus,
  onClose,
}: SwapConfirmationModalProps) {
  const [closed, setClosed] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const { tokens } = usePortfolio();

  // reset close when a new sweep starts
  useEffect(() => {
    if (show && swapStatus.status === 'confirming') setClosed(false);
  }, [show, swapStatus.status]);

  if (!show || closed) return null;

  /* ---------------------------------------------------------------------- */
  /* Progress helpers                                                       */
  /* ---------------------------------------------------------------------- */
  const processed = swapStatus.processedTokens ?? [];
  const total = processed.length;

  const completed = processed.filter(
    (t) => t.status === 'success' || t.status === 'failed' || t.status === 'skipped',
  ).length;

  const currentIdx = Math.min(completed + 1, total); // clamp to total
  const lastProcessed = completed ? processed[completed - 1] : undefined;

  const completedCount = processed.filter((t) => t.status === 'success').length;
  const failedCount = processed.filter((t) => t.status === 'failed').length;
  const skippedCount = processed.filter((t) => t.status === 'skipped').length;
  const hasSuccess = completedCount > 0;

  const addressToSymbol = (addr: string) =>
    tokens.find((t) => t.contractAddress.toLowerCase() === addr.toLowerCase())
      ?.symbol ?? `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  /* ---------------------------------------------------------------------- */
  /* Renderers                                                              */
  /* ---------------------------------------------------------------------- */
  const renderTokenStatus = (token: ProcessedToken, idx: number) => {
    const label: Record<ProcessedToken['status'], string> = {
      success: 'SUCCESS',
      failed: 'FAILED',
      skipped: 'SKIPPED',
      confirming: 'PENDING',
    };
    const textColor: Record<ProcessedToken['status'], string> = {
      success: 'text-green-500',
      failed: 'text-red-500',
      skipped: 'text-yellow-500',
      confirming: 'text-blue-400',
    };
    const dotBg: Record<ProcessedToken['status'], string> = {
      success: 'bg-green-500',
      failed: 'bg-red-500',
      skipped: 'bg-yellow-500',
      confirming: 'bg-blue-400',
    };

    return (
      <div key={token.address + idx} className="flex items-start gap-2 text-sm mb-2">
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${dotBg[token.status]}`} />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="text-white font-medium">
              {token.symbol || addressToSymbol(token.address)}
            </span>
            <span className={`font-bold ml-2 ${textColor[token.status]}`}>
              {label[token.status]}
            </span>
          </div>
          <div className="text-[#B8B4D8] text-xs">
            Amount: {token.amount}
            {token.reason && (
              <div className="mt-1">
                {token.reason.includes('User rejected')
                  ? 'Swap failed: User rejected the request.'
                  : token.reason}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProgress = () => {
    if (!processed.length) return null;

    const allDone = completed >= total;
    let label = `Processed ${total} tokens`;

    if (swapStatus.status === 'confirming' && !allDone) {
      label =
        lastProcessed?.status === 'skipped'
          ? `Skipping token ${completed} of ${total}`
          : `Token ${currentIdx} of ${total}`;
    }

    return <div className="mt-4 text-xs text-[#B8B4D8] text-center">{label}</div>;
  };

  const renderSummary = () =>
    (swapStatus.status === 'success' || swapStatus.status === 'error') && (
      <div ref={summaryRef} className="mt-4 text-left text-sm text-[#B8B4D8]">
        <div className="mb-2 font-semibold text-white">Summary</div>
        <div>✅ Succeeded: {completedCount}</div>
        <div>⚠️ Skipped: {skippedCount}</div>
        <div>❌ Failed: {failedCount}</div>
      </div>
    );

  /* ---------------------------------------------------------------------- */
  /* UI                                                                     */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#221B2F] p-6 rounded-2xl border border-[#32275A] w-full max-w-md mx-4 relative">
        {(swapStatus.status === 'success' || swapStatus.status === 'error') && (
          <button
            className="absolute top-2 right-2 text-[#B8B4D8] hover:text-white text-lg font-bold px-2 py-1 rounded focus:outline-none"
            onClick={() => {
              setClosed(true);
              onClose?.();
            }}
            aria-label="Close"
          >
            ×
          </button>
        )}

        <div className="text-center">
          {/* Confirming */}
          {swapStatus.status === 'confirming' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9F7AEA] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Processing Swap</h3>
              <p className="text-[#B8B4D8]">Please confirm the transaction in your wallet</p>
              {renderProgress()}
              {!!processed.length && (
                <div className="mt-4 text-left max-h-60 overflow-y-auto">
                  {processed.map(renderTokenStatus)}
                </div>
              )}
            </>
          )}

          {/* Success with at least one success */}
          {swapStatus.status === 'success' && hasSuccess && (
            <>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Swap Successful!</h3>
              <p className="text-[#B8B4D8]">Your tokens have been swapped successfully</p>
              {!!processed.length && (
                <div className="mt-4 text-left max-h-60 overflow-y-auto">
                  {processed.map(renderTokenStatus)}
                </div>
              )}
              {renderSummary()}
            </>
          )}

          {/* All failed or generic error */}
          {((swapStatus.status === 'success' && !hasSuccess) || swapStatus.status === 'error') && (
            <>
              <div className="w-12 h-12 bg-[#221B2F] rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <RiErrorWarningFill className="absolute inset-0 w-14 h-14 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {failedCount > skippedCount ? 'Swap Failed' : 'No Swaps Succeeded'}
              </h3>
              <p className="text-[#B8B4D8]">
                {failedCount > skippedCount
                  ? 'Some of your token swaps failed.'
                  : 'None of your tokens were swapped successfully.'}
              </p>
              {!!processed.length && (
                <div className="mt-4 text-left max-h-60 overflow-y-auto">
                  {processed.map(renderTokenStatus)}
                </div>
              )}
              {renderSummary()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
