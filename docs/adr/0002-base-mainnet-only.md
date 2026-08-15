# Base mainnet only

The app targets Base mainnet exclusively (chain ID 8453). Quote requests and the RPC client are hardcoded to Base, and native ETH handling assumes Base semantics. Testnet support was considered (the README previously claimed Base Sepolia) but the 0x and Alchemy integrations are configured for mainnet liquidity and data, so testnet would need separate API configuration.