// app/opengraph-image/route.tsx
import Image from 'next/image'
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { APP_ICON_URL } from '~/lib/constants'
import { getNeynarUser } from '~/lib/neynar'

export const revalidate = 60                  // ← 60 s de cache (optionnel)
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const fid = new URL(req.url).searchParams.get('fid')
  const user = fid ? await getNeynarUser(Number(fid)) : null

  const avatar = user?.pfp_url || APP_ICON_URL
  const display = user?.display_name || user?.username || 'Sweep'

  return new ImageResponse(
    (
      <div
        tw="flex h-full w-full flex-col items-center justify-center bg-purple-600 text-white"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Avatar */}
        <div tw="w-64 h-64 mb-8 rounded-full overflow-hidden border-8 border-white">
          <Image src={avatar} tw="w-full h-full object-cover" alt="Avatar" />
        </div>

        {/* Headline */}
        <h1 tw="text-7xl font-bold leading-tight text-center">
          {`Hello from ${display}!`}
        </h1>

        {/* Subline */}
        <p tw="text-4xl mt-6 opacity-80">Powered by Neynar 🪐</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,        // ratio 1.91:1 → meilleur rendu OG
    },
  )
}
