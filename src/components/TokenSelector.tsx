import Image from 'next/image';
import { TARGET_TOKENS } from '../configs/constants';
import { type TokenSymbol } from '../types/index';

interface TokenSelectorProps {
    selectedToken: TokenSymbol;
    onSelectToken: (token: TokenSymbol) => void;
}

export default function TokenSelector({ selectedToken, onSelectToken }: TokenSelectorProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#B8B4D8] mb-2">
                Select a token to Sweep into
            </label>
            <div className="flex flex-row gap-3 mb-2 w-full justify-center items-center">
                {TARGET_TOKENS.map((target) => (
                    <button
                        key={target.symbol}
                        type="button"
                        onClick={() => onSelectToken(target.symbol as TokenSymbol)}
                        className={`flex items-center gap-2 w-1/2 justify-center px-4 py-3 rounded-xl border-2 transition-colors font-semibold text-white text-base bg-white/5 hover:bg-white/10 focus:outline-none ${
                            selectedToken === target.symbol
                                ? 'border-[#9F7AEA] shadow-[0_0_6px_2px_rgba(159,122,234,0.4)] bg-[#231942]'
                                : 'border-[#32275A]'
                        }`}
                    >
                        <Image
                            src={target.logo}
                            alt={target.symbol}
                            width={36}
                            height={36}
                            className="rounded-full bg-white p-0.5 border-2 border-[#9F7AEA]"
                            unoptimized
                        />
                        <span>{target.symbol}</span>
                    </button>
                ))}
            </div>
        </div>
    );
} 