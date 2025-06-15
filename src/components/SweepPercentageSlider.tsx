interface SweepPercentageSliderProps {
  sweepPct: number;
  setSweepPct: (pct: number) => void;
}

export default function SweepPercentageSlider({ sweepPct, setSweepPct }: SweepPercentageSliderProps) {
  return (
    <div className="w-full space-y-2">
      <label htmlFor="sweepPct" className="text-sm font-medium text-[#B8B4D8]">
        Sweep percentage&nbsp;
        <span className="font-bold text-white">{sweepPct}%</span>
      </label>
      <div className="relative h-2 w-full">
        {/* track */}
        <div className="absolute inset-y-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-full bg-[#32275A]" />
        {/* thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `calc(${sweepPct}% - 0.5rem)` }}
        >
          <div
            className="h-3.5 w-3.5 rounded-sm bg-[#9F7AEA] shadow-md border border-white transition-transform duration-300 ease-linear"
            style={{ transform: `rotate(${45 + sweepPct * 0.9}deg)` }}
          />
        </div>
        {/* invisible range input */}
        <input
          id="sweepPct"
          type="range"
          min={0}
          max={100}
          step={5}
          value={sweepPct}
          onChange={e => setSweepPct(Number(e.target.value))}
          className="absolute inset-0 h-8 w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
} 