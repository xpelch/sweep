import { describe, expect, it } from 'vitest';
import { formatUsd } from './formatUtils';

describe('formatUsd', () => {
  it('formats with two decimals', () => {
    expect(formatUsd(12.5)).toBe('12.50');
  });

  it('formats zero', () => {
    expect(formatUsd(0)).toBe('0.00');
  });
});