import { TokenBalance } from 'alchemy-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { address } = await req.json();
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing Alchemy API key" }, { status: 500 });

  const url = `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;
  let tokenBalances: TokenBalance[] = [];
  let pageKey: string | undefined = undefined;
  do {
    const params: object[] = [address, "erc20"];

    if (pageKey) params.push({ pageKey });

    const body: object = {
      jsonrpc: "2.0",
      method: "alchemy_getTokenBalances",
      params,
      id: 1,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (data.result?.tokenBalances) {
      tokenBalances = tokenBalances.concat(data.result.tokenBalances);
      pageKey = data.result.pageKey;
    } else {
      pageKey = undefined;
    }
    
  } while (pageKey);

  return NextResponse.json({ tokenBalances });
}