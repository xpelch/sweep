import { type TokenSymbol } from '~/types';

interface ActionButtonsProps {
    onSweep: () => void;
    isLoading: boolean;
    selectedTokensCount: number;
    targetToken: TokenSymbol;
    isTargetTokenSelected?: boolean;
    disableSweep?: boolean;
}

export default function ActionButtons({
    onSweep,
    isLoading,
    selectedTokensCount,
    targetToken,
    isTargetTokenSelected = false,
    disableSweep = false,
}: ActionButtonsProps) {
    return (
        <div className="flex flex-row gap-3 mt-4">
            <button
                onClick={onSweep}
                disabled={selectedTokensCount === 0 || isLoading || isTargetTokenSelected || disableSweep}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-2xl shadow-lg text-base font-semibold text-white bg-[#9F7AEA] hover:bg-[#7C5DFA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9F7AEA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Sweeping...' : `Sweep Tokens to ${targetToken}`}
            </button>
        </div>
    );
}