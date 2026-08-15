import { formatUnits } from 'viem';
import type { TokenInfo } from '~/types';

export function calcRawAmount(token: TokenInfo, sweepPct: number): bigint {
  return (token.bigIntAmount * BigInt(sweepPct)) / 100n;
}

export function calcUiAmount(raw: bigint, decimals: number): string {
  return formatUnits(raw, decimals);
}

export function calcSweepUsd(totalValue: number, sweepPct: number): number {
  return (totalValue * sweepPct) / 100;
}