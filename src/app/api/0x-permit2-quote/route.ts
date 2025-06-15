import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { logError } from '~/lib/logger';

if (!process.env.ZERO_X_API_KEY) {
  throw new Error('Missing environment variable: ZERO_X_API_KEY');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams(searchParams);

  params.append('swapFeeRecipient', '0x78C825b3bBD9C08d0809C327ab042764C4D327c5');
  params.append('swapFeeBps', '100'); // 1 %
  params.append('swapFeeToken', params.get('buyToken') ?? '');

  const quoteUrl = `https://api.0x.org/swap/permit2/quote?${params.toString()}`;

  try {
    const { data } = await axios.get(quoteUrl, {
      headers: {
        '0x-api-key': process.env.ZERO_X_API_KEY,
        '0x-version': 'v2',
      },
    });

    if (data.liquidityAvailable === false) {
      return NextResponse.json(
        { message: 'No liquidity', liquidityAvailable: false },
        { status: 503 },
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    logError('0x API Error:', error);

    let errorMessage = 'Failed to fetch quote from 0x API.';
    let statusCode = 500;

    if (axios.isAxiosError(error) && error.response) {
      errorMessage = (error.response.data as { reason?: string })?.reason || errorMessage;
      statusCode = error.response.status;
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}
