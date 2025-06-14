import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { logError } from '~/lib/logger';

if (!process.env.ZERO_X_API_KEY) {
  throw new Error('Missing environment variable: ZERO_X_API_KEY');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams(searchParams);

  console.log('params', params.toString());
  // Ajoute les paramètres pour les frais
  // Note: '0x...' est l'adresse de ton allowance holder/wallet
  params.append('swapFeeRecipient', '0x78C825b3bBD9C08d0809C327ab042764C4D327c5');
  params.append('swapFeeBps', '100'); // 1%
  params.append('swapFeeToken', params.get('buyToken') || '');

  const quoteUrl = 'https://api.0x.org/swap/allowance-holder/quote?' + params.toString();

  try {
    const { data } = await axios.get(quoteUrl, {
      headers: {
        '0x-api-key': process.env.ZERO_X_API_KEY,
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
      // Si 0x API renvoie une erreur spécifique, on peut la relayer
      errorMessage = error.response.data.reason || errorMessage;
      statusCode = error.response.status;
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
} 