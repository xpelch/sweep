interface TotalSweepValueProps {
  totalSweepUsd: number;
}

export default function TotalSweepValue({ totalSweepUsd }: TotalSweepValueProps) {
  return (
    <div className="my-2">
      <hr className="border-[#32275A] mb-2" />
      <div className="flex justify-between items-center">
        <span className="text-white text-base font-bold">
          Total to sweep: ${totalSweepUsd.toFixed(2)}
        </span>
      </div>
    </div>
  );
} 