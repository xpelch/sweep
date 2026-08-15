import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useMiniApp } from '@neynar/react';
import { useState } from 'react';
import { TiPower } from 'react-icons/ti';

export default function ConnectWalletButton() {
  const { isConnected, address } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { context } = useMiniApp();
  const [localError, setLocalError] = useState<string | null>(null);

  if (isConnected) {
    return (
      <div className="px-4 py-2 rounded-xl bg-[#231942] text-[#b8b4d8] font-mono text-xs border border-[#28204a] flex items-center gap-2">
        {address?.slice(0, 6)}...{address?.slice(-4)}
        <button
          className="ml-2 p-1 rounded bg-[#9F7AEA] text-white text-xs hover:bg-[#7C5DFA] flex items-center justify-center"
          onClick={() => disconnect()}
          aria-label="Disconnect"
          title="Disconnect"
        >
          <TiPower size={18} />
        </button>
      </div>
    );
  }

  if (context) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          className="px-3 py-2 rounded-xl bg-[#9F7AEA] text-white font-semibold shadow hover:bg-[#7C5DFA] transition-colors border border-[#28204a] flex items-center justify-center"
          onClick={async () => {
            setLocalError(null);
            try {
              await connect({ connector: connectors[0] });
            } catch (e: unknown) {
              setLocalError(e instanceof Error ? e.message : 'Failed to connect');
            }
          }}
          disabled={isPending}
          aria-label="Connect Wallet"
          title="Connect Wallet"
        >
          <TiPower size={18} />
        </button>
        {(error || localError) && (
          <div className="text-xs text-red-400 mt-1">{error?.message || localError}</div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-2 rounded-xl bg-[#231942] text-[#b8b4d8] text-xs border border-[#28204a]">
      Wallet connect only works in Warpcast/Farcaster MiniApp.
    </div>
  );
} 