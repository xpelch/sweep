import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { PUBLIC_RPC_URL } from '~/configs/env';

export const publicClient = createPublicClient({
  chain: base,
  transport: http(PUBLIC_RPC_URL),
});