# Sweep — Token Consolidation Mini App

A modern Farcaster Mini App that lets users consolidate their token holdings into a single target token with one-click swaps powered by the 0x Protocol.

![Sweep App](public/screenshot/01.png)

## Features

- **Token Consolidation**: Sweep multiple tokens into ETH, USDC, or other major tokens.
- **Smart Portfolio Management**: Detect and display significant token holdings automatically.
- **Real-Time Pricing**: Live price feeds from Chainlink for accurate valuations.
- **Gas Optimization**: Intelligent transaction batching and approval management.
- **Farcaster Integration**: Native Mini App experience with seamless wallet connections.
- **Modern UI/UX**: Clean, responsive interface built with Next.js and Tailwind CSS.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Blockchain**: Viem, Wagmi, Base Network
- **DeFi**: 0x Protocol API, Permit2 for gas‑optimized approvals
- **Authentication**: Farcaster Auth Kit, NextAuth.js
- **Data**: Alchemy SDK, Upstash Redis
- **Deployment**: Vercel

## Screenshots

- ![Main Interface](public/screenshot/01.png)
- ![Token Selection](public/screenshot/02.png)
- ![Swap Confirmation](public/screenshot/03.png)

## Architecture

### Core Components

- **WalletSweep**: Main application component handling token consolidation logic.
- **PortfolioProvider**: Manages token balances and portfolio state.
- **useSweep**: Hook for swap execution and transaction management.
- **TokenSelector**: Interactive token selection interface.
- **SwapConfirmationModal**: Transaction confirmation and status tracking.

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Base Network RPC access
- 0x Protocol API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sweep

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
# App Configuration
NEXT_PUBLIC_URL=your-app-url
NEXT_PUBLIC_FRAME_NAME=Sweep
NEXT_PUBLIC_FRAME_DESCRIPTION=Consolidate your tokens with one click
NEXT_PUBLIC_FRAME_BUTTON_TEXT=Start Sweeping

# Blockchain
PUBLIC_RPC_URL=your-base-rpc-url
NEXT_PUBLIC_CHAIN_ID=8453

# APIs
ZEROX_API_KEY=your-0x-api-key
ALCHEMY_API_KEY=your-alchemy-key
NEYNAR_API_KEY=your-neynar-key

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=your-app-url
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
npm run deploy:vercel
```

## Configuration

### Supported Networks

- **Base Mainnet**: Primary network with full DeFi ecosystem.
- **Base Sepolia**: Testnet for development and testing.

### Target Tokens

- ETH (native)
- USDC
- WETH
- Custom tokens via 0x Protocol

## Performance

- **Bundle Size**: Optimized with Next.js 15 tree shaking.
- **Initial Load**: Fast startup with intelligent caching.
- **Transaction Speed**: Gas usage optimized with Permit2 approvals.
- **Reliability**: High availability with comprehensive error handling.

## Security

- **Audited Integrations**: Uses audited protocols where applicable.
- **Wallet Security**: Non-custodial design with user-controlled keys.
- **API Security**: Rate limiting and request validation.
- **Error Handling**: Graceful degradation and clear user feedback.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m "Add amazing feature"`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [0x Protocol](https://0x.org/) for decentralized exchange infrastructure.
- [Farcaster](https://farcaster.xyz/) for the social protocol.
- [Base](https://base.org/) for the L2 network.
- [Neynar](https://neynar.com/) for Farcaster development tools.

---

Built with ❤️ for the decentralized future.
