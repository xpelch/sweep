/* eslint-disable @typescript-eslint/no-explicit-any */
// helpers/permit2.ts

import { Hex, concat, size as hexSize, numberToHex } from 'viem';

/** Retire EIP712Domain, laisse 0x choisir la struct correcte */
function stripDomain(types: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { EIP712Domain, ...rest } = types;
  return rest;
}

/** Signe exactement le payload retourné par 0x */
export function signPermit2(
  eip712: {
    domain: any;
    types: Record<string, any>;
    message: Record<string, any>;
    primaryType: string;
  },
  signTypedData: ReturnType<typeof import('viem').createWalletClient>['signTypedData'],
  account: `0x${string}`,
) {
  return signTypedData({
    account,
    domain: eip712.domain,
    types: stripDomain(eip712.types),
    primaryType: eip712.primaryType as any,   // PermitBatch, PermitSingle, …
    message: eip712.message,
  });
}

/** calldata + <sigLen (uint256)> + <sig> */
export function appendSig(data: Hex, sig: Hex): Hex {
  const sigLen = numberToHex(hexSize(sig), { signed: false, size: 32 }) as Hex;
  return concat([data, sigLen, sig]);
}
