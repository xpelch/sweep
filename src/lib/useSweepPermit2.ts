'use client';

import { useCallback, useState } from 'react';
import {
  createPublicClient,
  http,
  type Address,
  type Hex
} from 'viem';
import { base } from 'viem/chains';
import { useWalletClient } from 'wagmi';
import { PUBLIC_RPC_URL } from '~/configs/env';
import { appendSig, signPermit2 } from '~/helpers/permit2';
import {
  TARGET_TOKENS,
  ZERO_ADDRESS,
} from '../configs/constants';
import {
  type SwapStatus
} from '../types';
import { blacklistToken, removeSignificantToken } from '../utils/tokenUtils';
import { logError, logInfo } from './logger';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const REQ_DELAY = 1_000; // 1 s

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
      uiAmounts: string[],
      rawAmounts: bigint[],
      selected?: { contractAddress: string; symbol: string }[],
    ) => {
      if (!walletClient) return setError('Wallet not connected');

      setIsLoading(true);
      setError(null);
      setSwapStatus({ status: 'confirming', processedTokens: [] });

      const processed: NonNullable<SwapStatus['processedTokens']> = [];

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const uiAmount = uiAmounts[i];
        const rawAmount = rawAmounts[i];
        const symbol =
          selected?.find((t) => t.contractAddress.toLowerCase() === token.toLowerCase())
            ?.symbol ??
          TARGET_TOKENS.find((t) => t.address.toLowerCase() === token.toLowerCase())
            ?.symbol;

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
          /* ---------------- 1. Quote (0x v2 Permit2) ---------------- */
          if (rawAmount === 0n) {
            processed.push({
              address: token,
              amount: uiAmount,
              status: 'skipped',
              reason: 'Amount too small',
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
            sellAmount: rawAmount.toString(),
            slippageBps: '500',
            taker: walletClient.account.address,
          });

          const res = await fetch(`/api/0x-permit2-quote?${params}`, {
            headers: { '0x-version': 'v2' },
          });

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

          const { transaction, permit2 } = await res.json(); // quote v2 permit2

          /* ---- signature EIP-712 ---- */
          const sig = await signPermit2(
            permit2.eip712,
            walletClient.signTypedData,
            walletClient.account.address,
          );
          
          /* ---- calldata prête ---- */
          const finalData = appendSig(transaction.data as Hex, sig);
          
          /* ---- envoi ---- */
          const txHash = await walletClient.sendTransaction({
            to: transaction.to as Address,
            data: finalData,
            value: BigInt(transaction.value ?? 0),
            gas: BigInt(transaction.gas),
            gasPrice: BigInt(transaction.gasPrice),
          });
  
          const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

          processed.push({
            address: token,
            amount: uiAmount,
            symbol,
            status: receipt.status === 'success' ? 'success' : 'failed',
            reason: receipt.status === 'success' ? undefined : 'Transaction reverted',
          });
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
        await sleep(REQ_DELAY);
      }

      setSwapStatus({ status: 'success', processedTokens: processed });
      onRefresh?.();
      setIsLoading(false);
    },
    [publicClient, walletClient],
  );

  return { sweep, isLoading, error, swapStatus };
}
