import { Alchemy, Network, TokenBalance, TokenBalanceType, TokenBalancesResponseErc20 } from 'alchemy-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { address } = await req.json();
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing Alchemy API key" }, { status: 500 });

  const alchemy = new Alchemy({
    apiKey,
    network: Network.BASE_MAINNET,
  });

  let tokenBalances: TokenBalance[] = [];
  let pageKey: string | undefined = undefined;
  do {
    const res: TokenBalancesResponseErc20 = await alchemy.core.getTokenBalances(address, { type: TokenBalanceType.ERC20, pageKey });
    tokenBalances = tokenBalances.concat(res.tokenBalances);
    pageKey = res.pageKey;
  } while (pageKey);

  return NextResponse.json({ tokenBalances });
} 