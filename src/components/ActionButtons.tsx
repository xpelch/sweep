import { TbTipJar } from 'react-icons/tb';
import { type TokenSymbol } from '../types/index';

interface ActionButtonsProps {
    onSweep: () => void;
    onTip: () => void;
    isLoading: boolean;
    selectedTokensCount: number;
    targetToken: TokenSymbol;
    isTargetTokenSelected?: boolean;
    hideTip?: boolean;
    disableSweep?: boolean;
}

export default function ActionButtons({
    onSweep,
    onTip,
    isLoading,
    selectedTokensCount,
    targetToken,
    isTargetTokenSelected = false,
    hideTip = true,
    disableSweep = false,
}: ActionButtonsProps) {
    return (
        <div className="flex flex-row gap-3 mt-4">
            {!hideTip && (
                <button
                    type="button"
                    className="w-1/6 flex justify-center items-center gap-2 py-1 px-1 rounded-2xl border-2 border-[#9F7AEA] text-[#9F7AEA] bg-transparent font-semibold shadow-sm hover:bg-[#231942] transition-colors focus:outline-none"
                    onClick={onTip}
                    aria-label="Tip Jar"
                >
                    <TbTipJar size={28} color="#9F7AEA" />
                </button>
            )}
            <button
                onClick={onSweep}
                disabled={selectedTokensCount === 0 || isLoading || isTargetTokenSelected || disableSweep}
                className={`${hideTip ? 'w-full' : 'w-5/6'} flex justify-center items-center py-3 px-4 border border-transparent rounded-2xl shadow-lg text-base font-semibold text-white bg-[#9F7AEA] hover:bg-[#7C5DFA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9F7AEA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
                {isLoading ? 'Sweeping...' : `Sweep Tokens to ${targetToken}`}
            </button>
        </div>
    );
} 