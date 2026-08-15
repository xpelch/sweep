import { useState } from "react";
import { FaWallet } from "react-icons/fa";
import { useWalletManager } from "../lib/useWalletManager";

function shortenAddress(addr: string) {
  return addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
}

export default function WalletDropdown() {
  const { address } = useWalletManager();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <button
      className="wallet-btn flex items-center gap-2 px-4 py-2 rounded-xl bg-[#231942] text-[#b8b4d8] font-mono text-xs border border-[#28204a] hover:bg-[#2d2350] transition relative"
      onClick={handleCopy}
      title={address || "No wallet connected"}
      disabled={!address}
    >
      <FaWallet />
      {address ? shortenAddress(address) : "No Wallet"}
      {copied && (
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-[#32275A] text-white text-xs rounded shadow z-10">
          Copied!
        </span>
      )}
    </button>
  );
} 