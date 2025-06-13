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
import { blacklistToken } from '../utils/tokenUtils';

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
      const quotes: (SwapQuote | null)[] = [];

      /* ---------------- Quotes (throttled) ---------------- */
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const symbol =
          selected?.find((t) => t.contractAddress.toLowerCase() === token.toLowerCase())
            ?.symbol ??
          TARGET_TOKENS.find((t) => t.address.toLowerCase() === token.toLowerCase())
            ?.symbol;
        const uiAmount = amounts[i];

        if (token.toLowerCase() === ZERO_ADDRESS) {
          processed.push({
            address: token,
            amount: uiAmount,
            status: 'skipped',
            reason: 'Native token',
            symbol,
          });
          quotes.push(null);
          updateStatus(processed);
          await sleep(REQ_DELAY);
          continue;
        }

        try {
          const decimals = await publicClient.readContract({
            address: token as Address,
            abi: ERC20_ABI,
            functionName: 'decimals',
          });

          const amount = parseUnits(uiAmount, Number(decimals));
          const qs = new URLSearchParams({
            chainId: '8453',
            sellToken: token,
            buyToken: targetToken,
            sellAmount: amount.toString(),
            slippageBps: '500',
            taker: walletClient.account.address,
          });
          const res = await fetch(`/api/0x-quote?${qs.toString()}`);

          if (res.status === 503) {
            blacklistToken(token);
            logInfo('blacklisted token', token);
            processed.push({
              address: token,
              amount: uiAmount,
              status: 'skipped',
              reason: 'No liquidity',
              symbol,
            });
            quotes.push(null);
            updateStatus(processed);
            await sleep(REQ_DELAY);
            continue;
          }

          if (!res.ok) throw new Error(await res.text());

          const { transaction } = await res.json();
          if (!transaction?.to)
            throw new Error('Quote response missing "to" address');

          quotes.push({
            token,
            amount,
            allowanceTarget: transaction.to,
            tx: {
              to: transaction.to as Address,
              data: transaction.data as Hex,
              value: transaction.value ? BigInt(transaction.value) : 0n,
            },
          });

          processed.push({
            address: token,
            amount: uiAmount,
            status: 'confirming',
            symbol,
          });
          updateStatus(processed);
        } catch (err) {
          logError('quote error', err);
          processed.push({
            address: token,
            amount: uiAmount,
            status: 'failed',
            reason: err instanceof Error ? err.message : 'Quote error',
            symbol,
          });
          quotes.push(null);
          updateStatus(processed);
        }
        await sleep(REQ_DELAY); // throttle ⇒ 1 req/s
      }

      /* --------------- Approvals & Swaps (unchanged) ---------------- */
      for (const q of quotes) {
        if (!q) continue;
        /* -- approval -- */
        try {
          if (q.allowanceTarget) {
            const allowance = await publicClient.readContract({
              address: q.token as Address,
              abi: ERC20_ABI,
              functionName: 'allowance',
              args: [walletClient.account.address, q.allowanceTarget as Address],
            });
            if (BigInt(allowance) < q.amount) {
              const hash = await walletClient.writeContract({
                address: q.token as Address,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [q.allowanceTarget as Address, MAX_UINT256],
              });
              await publicClient.waitForTransactionReceipt({ hash });
            }
          }
          /* -- swap -- */
          try {
            const swapHash = await walletClient.sendTransaction({
              to: q.tx.to,
              data: q.tx.data,
              value: q.tx.value,
            });
            const receipt = await publicClient.waitForTransactionReceipt({ hash: swapHash });
            const idx = processed.findIndex((t) => t.address === q.token);
            
            if (receipt.status !== 'success') {
              // Si revert et logs vide => low liquidity
              if (receipt.status === 'reverted' && Array.isArray(receipt.logs) && receipt.logs.length === 0) {
                blacklistToken(q.token);
                processed[idx] = {
                  ...processed[idx],
                  status: 'skipped',
                  reason: 'Low liquidity or Token not supported by 0x',
                };
              } else {
                // Sinon, failed avec raison générique
                processed[idx] = {
                  ...processed[idx],
                  status: 'failed',
                  reason: 'Transaction reverted',
                };
              }
            } else if (idx !== -1) {
              processed[idx].status = 'success';
            }
          } catch (err) {
            const idx = processed.findIndex((t) => t.address === q.token);
            const errMsg = err instanceof Error ? err.message : String(err);
            if (idx !== -1) {
              if (errMsg.toLowerCase().includes('arithmetic underflow')) {
                processed[idx] = {
                  ...processed[idx],
                  status: 'skipped',
                  reason: 'Arithmetic underflow',
                };
              } else {
                processed[idx] = {
                  ...processed[idx],
                  status: 'failed',
                  reason: errMsg,
                };
              }
            }
          }
        } catch (err) {
          const idx = processed.findIndex((t) => t.address === q.token);
          if (idx !== -1) {
            processed[idx] = {
              ...processed[idx],
              status: 'failed',
              reason: err instanceof Error ? err.message : 'Swap error',
            };
          }
        }
        updateStatus(processed);
      }

      setSwapStatus({ status: 'success', processedTokens: processed });
      onRefresh?.();
      setIsLoading(false);
    },
    // eslint-disable-next-line
    [publicClient, walletClient],
  );

  return { sweep, isLoading, error, swapStatus };
}
