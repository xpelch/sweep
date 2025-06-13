import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { addresses } = await req.json();
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing Alchemy API key" }, { status: 500 });

  const url = `https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/by-address`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresses }),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
