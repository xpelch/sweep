import Image from 'next/image';
import { FiRefreshCw } from 'react-icons/fi';
import WalletDropdown from './WalletDropdown';

interface NavBarProps {
    onRefresh: () => void;
    isRefreshing: boolean;
}

export default function NavBar({ onRefresh, isRefreshing }: NavBarProps) {
    return (
        <div className="flex items-center justify-between pt-6 mb-6 sticky top-0 z-10 bg-[#1A1523]">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                Sweep
                <span className="inline-block align-middle">
                    <Image
                        src="/icon.png"
                        alt="Sweep Icon"
                        width={32}
                        height={32}
                        className="rounded-2xl"
                        priority
                    />
                </span>
            </h1>
            <div className="flex items-center gap-2">
                <button
                    onClick={onRefresh}
                    className={`flex items-center justify-center px-4 py-2 rounded-xl bg-[#231942] border border-[#28204a] hover:bg-[#2d2350] transition-colors focus:outline-none ${isRefreshing ? 'opacity-60 cursor-wait' : ''}`}
                    title="Refresh token balances"
                    disabled={isRefreshing}
                    style={{ minWidth: 32, minHeight: 32 }}
                >
                    {isRefreshing ? (
                        <span className="animate-spin"><FiRefreshCw size={16} color="#9F7AEA" /></span>
                    ) : (
                        <FiRefreshCw size={16} color="#9F7AEA" />
                    )}
                </button>
                <WalletDropdown />
            </div>
        </div>
    );
} 