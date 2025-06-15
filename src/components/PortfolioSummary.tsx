import { FaEthereum } from "react-icons/fa";
import { formatUsd } from './../utils/formatUtils';

interface PortfolioSummaryProps {
  portfolioEth?: number;
  portfolioUsd: number;
  ethBalNumber?: number;
}

export default function PortfolioSummary({ portfolioEth, portfolioUsd, ethBalNumber }: PortfolioSummaryProps) {
  if (portfolioEth === undefined || ethBalNumber === undefined) return null;
  return (
    <div className="flex justify-between text-xs text-[#B8B4D8] mb-2 space-y-0.5">
      <div className="text-left flex items-center">
        Holdings ≈ {portfolioEth.toFixed(4)} <FaEthereum className="inline-block mr-1" /> | ${formatUsd(portfolioUsd)}
      </div>
      <div className="text-right flex items-center">
        ETH: {ethBalNumber.toFixed(4)} <FaEthereum className="inline-block mr-0.3" />
      </div>
    </div>
  );
} 