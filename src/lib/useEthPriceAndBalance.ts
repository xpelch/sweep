import { useEffect, useState } from 'react';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';
import { publicClient } from '~/lib/rpc';

const ETH_USD_FEED: Address = '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70';
const FEED_ABI = [
  {
    name: 'latestAnswer',
    outputs: [{ type: 'int256' }],
    inputs: [],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useEthPriceAndBalance(refreshKey: number) {
  const { address } = useAccount();
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [ethBalance, setEthBalance] = useState<bigint | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [answer, balance] = await Promise.all([
          publicClient.readContract({
            address: ETH_USD_FEED,
            abi: FEED_ABI,
            functionName: 'latestAnswer',
          }),
          address ? publicClient.getBalance({ address }) : 0n,
        ]);
        const price = Number(answer) / 1e8;
        if (price > 0) setEthPrice(price);
        setEthBalance(balance);
      } catch (e) {
        console.error('Failed to fetch ETH price/balance', e);
      }
    })();
  }, [address, refreshKey]);

  return { ethPrice, ethBalance };
}