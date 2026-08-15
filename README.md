# Sweep — Token Consolidation Mini App

A Farcaster Mini App (Frames v2) that lets users consolidate their token holdings into a single target token with one-click swaps powered by the 0x Protocol on Base.

![Sweep App](public/screenshot/01.png)

## Features

- **Sweep to a target token**: Convert any number of selected holdings into ETH, USDC, or PRO in one flow.
- **Sweep percentage**: Choose what fraction of each holding to convert (0–100%).
- **Smart defaults**: Dust tokens (under ~$0.01) and tokens without 0x liquidity are hidden automatically; hidden tokens are remembered per browser.
- **Live valuations**: Balances via Alchemy, prices via Alchemy's price API, with a 5-minute client-side cache.
- **Farcaster native**: Sign in with Farcaster, add the mini app, and receive notifications.
- **Per-token status tracking**: The confirmation modal shows each token as pending, successful, skipped, or failed.

## How it works

1. The user connects a wallet inside Warpcast (or a Farcaster mini-app environment) and their ERC-20 balances on Base are fetched via Alchemy.
2. Holdings are enriched with metadata and prices, filtered for dust, and displayed.
3. The user picks a target token and a sweep percentage, then selects which holdings to sweep.
4. For each selected holding, the app fetches a firm quote from the 0x `/swap/allowance-holder/quote` endpoint, approves the allowance holder if needed, and submits the swap transaction.
5. Swaps run sequentially, one transaction per holding, with per-token results shown in the confirmation modal.

## Tech stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (strict)
- **Styling**: Tailwind CSS
- **Blockchain**: Viem, Wagmi, Base Network
- **DeFi**: 0x Protocol API (allowance holder, v2)
- **Farcaster**: Frame SDK, Auth Kit, Neynar
- **Data**: Alchemy, Upstash Redis (optional, for notifications)
- **Deployment**: Vercel

## Architecture

The app is a Next.js project split into:

- `src/app/` — pages and API routes (balances, prices, quotes, webhooks, auth)
- `src/components/` — UI components, split by concern (portfolio, selection, sweep orchestration)
- `src/components/providers/` — React context providers (wagmi, portfolio, loading)
- `src/lib/` — client and server hooks, plus shared infrastructure (RPC client, KV store, notifications, logging)
- `src/configs/` — environment-derived constants (target tokens, ABI, RPC URL)
- `src/utils/` — pure helpers (sweep math, token utilities, formatting)
- `src/types/` — shared domain types

Design decisions are recorded in [`docs/adr/`](docs/adr/); domain vocabulary lives in [`CONTEXT.md`](CONTEXT.md).

## Getting started

### Prerequisites

- Node.js 20+
- An Alchemy API key and a 0x API key (required for balances, prices, and quotes)

### Installation

```bash
git clone <repository-url>
cd sweep
npm install
cp .env.example .env.local
```

Fill in the values in `.env.local`:

```env
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_FRAME_NAME=Sweep
NEXT_PUBLIC_FRAME_DESCRIPTION=Consolidate your token holdings into a single target token
NEXT_PUBLIC_FRAME_BUTTON_TEXT=Start Sweeping

ALCHEMY_API_KEY=your-alchemy-key
ZERO_X_API_KEY=your-0x-api-key
NEYNAR_API_KEY=your-neynar-key      # optional, for notifications
NEYNAR_CLIENT_ID=your-neynar-client-id

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### Development

```bash
npm run dev          # starts Next.js on port 3000 (with localtunnel when USE_TUNNEL=true)
npm run build        # production build
npm run lint         # ESLint
npm test             # unit tests (Vitest)
npm run deploy:vercel
```

To preview the mini app inside Warpcast, open the Warpcast Mini App Developer Tools and enter your app URL (see `scripts/dev.js` output).

## Target tokens

- **ETH** — native token
- **USDC** — `0x8335...2913`
- **PRO** — `0xf65c...e6c`

## Known limitations

- **Base mainnet only** — no testnet or multi-chain support (see [ADR-0002](docs/adr/0002-base-mainnet-only.md)).
- **Sequential swaps** — one transaction per token; no batching (see [ADR-0001](docs/adr/0001-sequential-sweep-execution.md)).
- **1% swap fee** — every quote carries a 1% fee to the app's fee recipient (see [ADR-0003](docs/adr/0003-0x-swap-fee.md)).
- **No automated end-to-end tests** — unit tests cover the pure logic; wallet flows require manual testing in Warpcast.
- **Wallet connect only works in a Farcaster mini-app environment** (Warpcast), not a plain browser.

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- [0x Protocol](https://0x.org/) for decentralized exchange infrastructure
- [Farcaster](https://farcaster.xyz/) for the social protocol
- [Base](https://base.org/) for the L2 network
- [Neynar](https://neynar.com/) for Farcaster development tools