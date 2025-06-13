import { NextRequest, NextResponse } from "next/server";

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

type TokenMetadata = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
};

export async function POST(req: NextRequest) {
  const { addresses } = await req.json();
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return NextResponse.json({ error: 'No addresses provided' }, { status: 400 });
  }



  return NextResponse.json({ metadatas });
}