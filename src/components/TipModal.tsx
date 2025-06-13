import Image from 'next/image';
import { useState } from 'react';
import { TbTipJar } from 'react-icons/tb';

const TARGETS = [
    {
        symbol: 'ETH',
        name: 'Ethereum',
        logo: '/eth.svg',
        address: '0x0000000000000000000000000000000000000000',
    },
    {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: '/usdc.svg',
        address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    },
    // {
    //     symbol: 'PRO',
    //     name: 'Procoin',
    //     logo: '/pro.svg',
    //     address: '0xf65c3c30dd36b508e29a538b79b21e9b9e504e6c',
    // },
];

interface TipModalProps {
    open: boolean;
    onClose: () => void;
    onSend: (amount: string, currency: 'ETH' | 'USDC' | 'PRO') => void;
    initialAmount?: string;
    initialCurrency?: 'ETH' | 'USDC' | 'PRO';
}

export default function TipModal({
    open,
    onClose,
    onSend,
    initialAmount = '0.5',
    initialCurrency = 'USDC',
}: TipModalProps) {
    const [tipAmount, setTipAmount] = useState(initialAmount);
    const [targetToken, setTargetToken] = useState<'ETH' | 'USDC' | 'PRO'>(initialCurrency);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-[#221B2F] rounded-2xl p-6 shadow-xl border border-[#32275A] min-w-[320px] flex flex-col items-center">
                <div className="flex items-center gap-2 mb-4">
                    <TbTipJar size={28} color="#9F7AEA" />
                    <span className="text-white text-lg font-bold">Tip Jar</span>
                </div>
                <label className="text-[#B8B4D8] text-sm mb-2">Enter tip amount (USD):</label>

                <div className="flex gap-3 w-full justify-center" style={{ marginBottom: '10px' }}>
                    {[
                        { label: '$0.5', value: '0.5' },
                        { label: '$1', value: '1' },
                        { label: '$2', value: '2' },
                    ].map((preset) => (
                        <button
                            key={preset.value}
                            style={{
                                maxWidth: '42px',
                            }}
                            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors border-2 focus:outline-none
                                ${
                                    tipAmount === preset.value
                                        ? 'bg-[#231942] border-[#9F7AEA] text-white shadow-[0_0_6px_2px_rgba(159,122,234,0.15)]'
                                        : 'bg-[#32275A] border-[#32275A] text-[#B8B4D8] hover:bg-[#28204a]'
                                }
                            `}
                            onClick={() => setTipAmount(preset.value)}
                            type="button"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#32275A] bg-[#1A1523] text-white text-center mb-4 focus:outline-none focus:border-[#9F7AEA]"
                />
                <div className="flex gap-2 mb-4 w-full justify-center">
                    {TARGETS.map((target) => (
                        <button
                            key={target.symbol}
                            type="button"
                            onClick={() => setTargetToken(target.symbol as 'ETH' | 'USDC' | 'PRO')}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg border-2 transition-colors font-semibold text-white text-sm bg-white/5 hover:bg-white/10 focus:outline-none ${
                                targetToken === target.symbol
                                    ? 'border-[#9F7AEA] shadow-[0_0_6px_2px_rgba(159,122,234,0.4)] bg-[#231942]'
                                    : 'border-[#32275A]'
                            }`}
                        >
                            <Image
                                src={target.logo}
                                alt={target.symbol}
                                width={20}
                                height={20}
                                className="rounded-full bg-white p-0.5 border border-[#9F7AEA]"
                                unoptimized
                            />
                            <span>{target.symbol}</span>
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 w-full">
                    <button
                        className="flex-1 py-2 rounded-lg bg-[#9F7AEA] text-white font-semibold hover:bg-[#7C5DFA] transition-colors"
                        onClick={() => {
                            onSend(tipAmount, targetToken);
                            onClose();
                        }}
                    >
                        Send Tip
                    </button>
                    <button
                        className="flex-1 py-2 rounded-lg bg-[#32275A] text-[#B8B4D8] font-semibold hover:bg-[#28204a] transition-colors"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
                <div
                    className="text-xs text-[#B8B4D8] mt-2 text-center"
                    style={{ marginBottom: '-5px' }}
                >
                    Tip amount is always calculated in USD.
                </div>
            </div>
        </div>
    );
}
