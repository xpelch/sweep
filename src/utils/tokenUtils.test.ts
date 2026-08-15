import { describe, expect, it } from 'vitest';
import type { TokenInfo } from '~/types';
import { calculateTotalValue } from './tokenUtils';

function makeToken(address: string, amount: string): TokenInfo {
  return {
    contractAddress: address,
    symbol: 'TEST',
    name: 'Test Token',
    logo: null,
    decimals: 18,
    bigIntAmount: 0n,
    amount,
  };
}

describe('calculateTotalValue', () => {
  it('sums each token amount times its price', () => {
    const tokens = [makeToken('0xaaa', '2'), makeToken('0xbbb', '3')];
    const prices = { '0xaaa': 10, '0xbbb': 5 };
    expect(calculateTotalValue(tokens, prices)).toBe(35);
  });

  it('ignores tokens without a price', () => {
    const tokens = [makeToken('0xaaa', '2'), makeToken('0xccc', '7')];
    const prices = { '0xaaa': 10 };
    expect(calculateTotalValue(tokens, prices)).toBe(20);
  });

  it('looks prices up case-insensitively', () => {
    const tokens = [makeToken('0xAAA', '2')];
    const prices = { '0xaaa': 10 };
    expect(calculateTotalValue(tokens, prices)).toBe(20);
  });

  it('returns zero for an empty portfolio', () => {
    expect(calculateTotalValue([], {})).toBe(0);
  });
});