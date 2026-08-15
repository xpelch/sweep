interface TokenBalancesHeaderProps {
  isAllSelected: boolean;
  toggleAll: () => void;
}

export default function TokenBalancesHeader({ isAllSelected, toggleAll }: TokenBalancesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-md font-semibold text-white">Token Balances</h3>
      <button
        type="button"
        onClick={toggleAll}
        className="px-2 py-1 rounded-md text-[#9F7AEA] border border-transparent hover:border-[#9F7AEA] text-xs font-medium transition-colors focus:outline-none"
      >
        {isAllSelected ? 'Unselect All' : 'Select All'}
      </button>
    </div>
  );
} 