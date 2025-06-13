import { useState } from "react";
import { FaWallet } from "react-icons/fa";
import { SiCoinbase } from "react-icons/si";
import { Connector, useAccount, useConnect, useDisconnect } from "wagmi";

export type WalletType = "metamask" | "coinbase" | "farcaster";

export interface WalletInfo {
  type: WalletType;
  name: string;
  icon: React.ReactNode;
  connector: Connector;
}

export function useWalletManager() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [currentType, setCurrentType] = useState<WalletType | null>(null);

  const availableWallets: WalletInfo[] = [
    {
      type: "farcaster" as const,
      name: "Farcaster",
      icon: FaWallet && (typeof FaWallet === 'function' ? FaWallet({}) : null),
      connector: connectors.find((c) => c.id === "farcasterFrame")!,
    },
    {
      type: "coinbase" as const,
      name: "Coinbase",
      icon: SiCoinbase && (typeof SiCoinbase === 'function' ? SiCoinbase({}) : null),
      connector: connectors.find((c) => c.id === "coinbaseWallet")!,
    },
    {
      type: "metamask" as const,
      name: "MetaMask",
      icon: FaWallet && (typeof FaWallet === 'function' ? FaWallet({}) : null),
      connector: connectors.find((c) => c.id === "metaMask")!,
    },
  ].filter((w) => w.connector);

  async function switchWallet(type: WalletType) {
    const wallet = availableWallets.find((w) => w.type === type);
    if (!wallet) return;
    await disconnect();
    await connect({ connector: wallet.connector });
    setCurrentType(type);
  }

  return {
    address,
    isConnected,
    currentType,
    availableWallets,
    switchWallet,
    disconnect,
    error,
    isPending,
  };
} 