import { useAccount } from 'wagmi';
import { useEIP7702 } from '../lib/useViemEIP7702';

export default function WalletUpgradeButton() {
    const { upgradeAccount, isLoading, error } = useEIP7702();
    const { isConnected } = useAccount();

    if (!isConnected) {
        return null;
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={upgradeAccount}
                disabled={isLoading}
                className="px-3 py-2 rounded-xl bg-[#9F7AEA] text-white font-semibold shadow hover:bg-[#7C5DFA] transition-colors border border-[#28204a] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Upgrading...' : 'Upgrade Wallet'}
            </button>
            {error && (
                <div className="text-xs text-red-400 mt-1">{error}</div>
            )}
        </div>
    );
} 