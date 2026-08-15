import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing Alchemy API key' },
      { status: 500 },
    );
  }

  try {
    const { addresses } = await req.json();
    if (!Array.isArray(addresses)) {
      return NextResponse.json({ error: 'Invalid addresses' }, { status: 400 });
    }

    const url = `https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/by-address`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Alchemy API error: ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch token prices' },
      { status: 500 },
    );
  }
}