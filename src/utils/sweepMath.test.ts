import { describe, expect, it } from 'vitest';
import type { TokenInfo } from '~/types';
import { calcRawAmount, calcSweepUsd, calcUiAmount } from './sweepMath';

const ONE_TOKEN = 1000000000000000000n;

function makeToken(bigIntAmount: bigint): TokenInfo {
  return {
    contractAddress: '0x0000000000000000000000000000000000000001',
    symbol: 'TEST',
    name: 'Test Token',
    logo: null,
    decimals: 18,
    bigIntAmount,
    amount: '1',
  };
}

describe('calcRawAmount', () => {
  it('converts 100% to the full balance', () => {
    expect(calcRawAmount(makeToken(ONE_TOKEN), 100)).toBe(ONE_TOKEN);
  });

  it('converts 50% to half the balance', () => {
    expect(calcRawAmount(makeToken(ONE_TOKEN), 50)).toBe(500000000000000000n);
  });

  it('converts 0% to zero', () => {
    expect(calcRawAmount(makeToken(ONE_TOKEN), 0)).toBe(0n);
  });

  it('rounds down fractional amounts', () => {
    expect(calcRawAmount(makeToken(ONE_TOKEN), 33)).toBe(330000000000000000n);
  });
});

describe('calcUiAmount', () => {
  it('formats a raw amount with its decimals', () => {
    expect(calcUiAmount(ONE_TOKEN, 18)).toBe('1');
  });

  it('formats a small amount', () => {
    expect(calcUiAmount(123n, 6)).toBe('0.000123');
  });
});

describe('calcSweepUsd', () => {
  it('applies the sweep percentage to a USD total', () => {
    expect(calcSweepUsd(1000, 25)).toBe(250);
  });

  it('returns zero for a zero total', () => {
    expect(calcSweepUsd(0, 100)).toBe(0);
  });
});