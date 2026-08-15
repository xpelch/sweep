import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { logError } from '~/lib/logger';

export async function GET(req: NextRequest) {
  const apiKey = process.env.ZERO_X_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: 'Missing environment variable: ZERO_X_API_KEY' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams(searchParams);

  // Add the swap fee parameters for the allowance holder
  params.append('swapFeeRecipient', '0x78C825b3bBD9C08d0809C327ab042764C4D327c5');
  params.append('swapFeeBps', '100'); // 1%
  params.append('swapFeeToken', params.get('buyToken') || '');

  const quoteUrl = 'https://api.0x.org/swap/allowance-holder/quote?' + params.toString();

  try {
    const { data } = await axios.get(quoteUrl, {
      headers: {
        '0x-api-key': apiKey,
        '0x-version': 'v2',
      },
    });
    
    if (data.liquidityAvailable === false) {
      return NextResponse.json({ message: 'No liquidity', liquidityAvailable: false }, { status: 503 });
    }
    return NextResponse.json(data);
    
  } catch (error: unknown) {
    logError('0x API Error:', error);

    let errorMessage = 'Failed to fetch quote from 0x API.';
    let statusCode = 500;

    if (axios.isAxiosError(error) && error.response) {
      // Relay the specific error returned by the 0x API
      errorMessage = error.response.data.reason || errorMessage;
      statusCode = error.response.status;
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
} 