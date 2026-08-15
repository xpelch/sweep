import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { createConfig, http, useAccount, useConnect, WagmiProvider } from "wagmi";
import { base, celo, degen, mainnet, optimism, unichain } from "wagmi/chains";
import { coinbaseWallet, metaMask } from 'wagmi/connectors';
import { APP_ICON_URL, APP_NAME, APP_URL } from "~/lib/constants";

// Custom hook for Coinbase Wallet detection and auto-connection
function useCoinbaseWalletAutoConnect() {
  const [isCoinbaseWallet, setIsCoinbaseWallet] = useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const hasAttemptedConnection = useRef(false);

  useEffect(() => {
    // Check if we're running in Coinbase Wallet
    const checkCoinbaseWallet = () => {
      try {
        // Safely check for Coinbase Wallet without modifying window.ethereum
        const ethereum = window.ethereum;
        const isInCoinbaseWallet = ethereum?.isCoinbaseWallet || 
          ethereum?.isCoinbaseWalletExtension ||
          ethereum?.isCoinbaseWalletBrowser;
        setIsCoinbaseWallet(!!isInCoinbaseWallet);
      } catch (error) {
        console.warn('Error checking for Coinbase Wallet:', error);
        setIsCoinbaseWallet(false);
      }
    };
    
    checkCoinbaseWallet();
    
    // Only add event listener if window.ethereum exists
    if (window.ethereum) {
      window.addEventListener('ethereum#initialized', checkCoinbaseWallet);
      return () => {
        window.removeEventListener('ethereum#initialized', checkCoinbaseWallet);
      };
    }
  }, []);

  useEffect(() => {
    // Auto-connect if in Coinbase Wallet and not already connected
    if (isCoinbaseWallet && !isConnected && !hasAttemptedConnection.current) {
      hasAttemptedConnection.current = true;
      // Use setTimeout to ensure this runs after the render phase
      setTimeout(() => {
        try {
          connect({ connector: connectors[1] }); // Coinbase Wallet connector
        } catch (error) {
          console.warn('Error connecting to Coinbase Wallet:', error);
        }
      }, 0);
    }
  }, [isCoinbaseWallet, isConnected, connect, connectors]);

  return isCoinbaseWallet;
}

export const config = createConfig({
  chains: [base, optimism, mainnet, degen, unichain, celo],
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
    [mainnet.id]: http(),
    [degen.id]: http(),
    [unichain.id]: http(),
    [celo.id]: http(),
  },
  connectors: [
    farcasterFrame(),
    coinbaseWallet({
      appName: APP_NAME,
      appLogoUrl: APP_ICON_URL,
      preference: 'all',
    }),
    metaMask({
      dappMetadata: {
        name: APP_NAME,
        url: APP_URL,
      },
    }),
  ],
});

const queryClient = new QueryClient();

// Wrapper component that provides Coinbase Wallet auto-connection
function CoinbaseWalletAutoConnect({ children }: { children: React.ReactNode }) {
  useCoinbaseWalletAutoConnect();
  return <>{children}</>;
}

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <CoinbaseWalletAutoConnect>
          {children}
        </CoinbaseWalletAutoConnect>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
