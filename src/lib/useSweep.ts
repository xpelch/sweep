import { useCallback, useState } from 'react';
import {
  createPublicClient,
  http,
  parseUnits,
  type Address,
  type Hex,
} from 'viem';
import { base } from 'viem/chains';
import { useWalletClient } from 'wagmi';
import { logError, logInfo } from './logger';

import { PUBLIC_RPC_URL } from '~/configs/env';
import {
  ERC20_ABI,
  MAX_UINT256,
  TARGET_TOKENS,
  ZERO_ADDRESS,
} from '../configs/constants';
import { type SwapQuote, type SwapStatus } from '../types';
import { blacklistToken, removeSignificantToken } from '../utils/tokenUtils';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const REQ_DELAY = 1_000; // 1 seconde

export function useSweep(onRefresh?: () => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapStatus, setSwapStatus] = useState<SwapStatus>({ status: 'idle' });

  const { data: walletClient } = useWalletClient();
  const publicClient = createPublicClient({
    chain: base,
    transport: http(PUBLIC_RPC_URL),
  });

  const updateStatus = (processed: SwapStatus['processedTokens']) =>
    setSwapStatus({ status: 'confirming', processedTokens: [...(processed ?? [])] });

  const sweep = useCallback(
    async (
      tokens: string[],
      targetToken: string,
      amounts: string[],
      selected?: { contractAddress: string; symbol: string }[],
    ) => {
      if (!walletClient) return setError('Wallet not connected');

      setIsLoading(true);
      setError(null);
      setSwapStatus({ status: 'confirming', processedTokens: [] });

      const processed: NonNullable<SwapStatus['processedTokens']> = [];

      /* ------------------------------------------------------------------ */
      /* Loop token par token : Quote → Approve (si besoin) → Swap → Statut */
      /* ------------------------------------------------------------------ */
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const uiAmount = amounts[i];
        const symbol =
          selected?.find((t) => t.contractAddress.toLowerCase() === token.toLowerCase())
            ?.symbol ??
          TARGET_TOKENS.find((t) => t.address.toLowerCase() === token.toLowerCase())
            ?.symbol;

        /* --------- Cas natif : on ignore (rien à swap) ------------------ */
        if (token.toLowerCase() === ZERO_ADDRESS) {
          processed.push({
            address: token,
            amount: uiAmount,
            status: 'skipped',
            reason: 'Native token',
            symbol,
          });
          updateStatus(processed);
          await sleep(REQ_DELAY);
          continue;
        }

        try {
          /* --------- 1. Quote (0x) ------------------------------------- */
          const decimals = await publicClient.readContract({
            address: token as Address,
            abi: ERC20_ABI,
            functionName: 'decimals',
          });
          
          let amount = parseUnits(uiAmount, Number(decimals));
          amount = (amount * 99n) / 100n;

          if (amount === 0n) {
            processed.push({
              address: token,
              amount: uiAmount,
              status: 'skipped',
              reason: 'Amount too small to sweep',
              symbol,
            });
            updateStatus(processed);
            await sleep(REQ_DELAY);
            continue;
          }

          const params = new URLSearchParams({
            chainId: '8453',
            sellToken: token,
            buyToken: targetToken,
            sellAmount: amount.toString(),
            slippageBps: '500',
            taker: walletClient.account.address,
            sellEntireBalance: 'true',
          });
          const res = await fetch(`/api/0x-quote?${params.toString()}`);

          if (res.status === 503) {
            blacklistToken(token);
            removeSignificantToken(token);
            logInfo('blacklisted token', token);
            processed.push({
              address: token,
              amount: uiAmount,
              status: 'skipped',
              reason: 'No liquidity',
              symbol,
            });
            updateStatus(processed);
            await sleep(REQ_DELAY);
            continue;
          }

          if (!res.ok) throw new Error(await res.text());

          const { transaction } = await res.json();
          if (!transaction?.to)
            throw new Error('Quote response missing "to" address');

          const quote: SwapQuote = {
            token,
            amount,
            allowanceTarget: transaction.to,
            tx: {
              to: transaction.to as Address,
              data: transaction.data as Hex,
              value: transaction.value ? BigInt(transaction.value) : 0n,
            },
          };

          processed.push({
            address: token,
            amount: uiAmount,
            status: 'confirming',
            symbol,
          });
          updateStatus(processed);

          /* --------- 2. Approve si nécessaire -------------------------- */
          if (quote.allowanceTarget) {
            const allowance = await publicClient.readContract({
              address: quote.token as Address,
              abi: ERC20_ABI,
              functionName: 'allowance',
              args: [walletClient.account.address, quote.allowanceTarget as Address],
            });
            if (BigInt(allowance) < quote.amount) {
              const approveHash = await walletClient.writeContract({
                address: quote.token as Address,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [quote.allowanceTarget as Address, MAX_UINT256],
              });
              await publicClient.waitForTransactionReceipt({ hash: approveHash });
            }
          }

          /* --------- 3. Swap ------------------------------------------ */
          const swapHash = await walletClient.sendTransaction({
            to: quote.tx.to,
            data: quote.tx.data,
            value: quote.tx.value,
          });
          const receipt = await publicClient.waitForTransactionReceipt({ hash: swapHash });

          const idx = processed.findIndex((t) => t.address === quote.token);

          if (receipt.status !== 'success') {
            if (
              receipt.status === 'reverted' &&
              Array.isArray(receipt.logs) &&
              receipt.logs.length === 0
            ) {
              blacklistToken(quote.token);
              processed[idx] = {
                ...processed[idx],
                status: 'skipped',
                reason: 'Low liquidity or Token not supported by 0x',
              };
            } else {
              processed[idx] = {
                ...processed[idx],
                status: 'failed',
                reason: 'Transaction reverted',
              };
            }
          } else {
            processed[idx].status = 'success';
          }
        } catch (err) {
          logError('sweep error', err);
          processed.push({
            address: token,
            amount: uiAmount,
            status: 'failed',
            reason: err instanceof Error ? err.message : 'Unknown error',
            symbol,
          });
        }

        updateStatus(processed);
        await sleep(REQ_DELAY); // throttle => 1 req/s
      }

      /* ------------------------ Fin du lot ---------------------------- */
      setSwapStatus({ status: 'success', processedTokens: processed });
      onRefresh?.();
      setIsLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [publicClient, walletClient],
  );

  return { sweep, isLoading, error, swapStatus };
}
