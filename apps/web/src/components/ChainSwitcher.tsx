import { type ChainType, useChainType } from '@/providers/ChainTypeContext';

interface ChainSwitcherProps {
  className?: string;
}

export function ChainSwitcher({ className = '' }: ChainSwitcherProps) {
  const { chainType, setChainType } = useChainType();

  return (
    <div className={`flex items-center gap-1 bg-[#1a1a2e] rounded-full p-1 ${className}`}>
      <ChainButton
        label="EVM"
        isActive={chainType === 'evm'}
        onClick={() => setChainType('evm')}
      />
      <ChainButton
        label="Solana"
        isActive={chainType === 'solana'}
        onClick={() => setChainType('solana')}
      />
    </div>
  );
}

interface ChainButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ChainButton({ label, isActive, onClick }: ChainButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-1.5 text-xs font-medium rounded-full transition-all
        ${isActive
          ? 'bg-[#676FFF] text-white'
          : 'bg-transparent text-gray-400 hover:text-white'
        }
      `}
    >
      {label}
    </button>
  );
}

// Compact version for header
export function ChainSwitcherCompact({ className = '' }: ChainSwitcherProps) {
  const { chainType, toggleChainType } = useChainType();

  return (
    <button
      type="button"
      onClick={toggleChainType}
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
        bg-[#1a1a2e] rounded-full transition-all hover:bg-[#252542]
        ${className}
      `}
    >
      <span className={chainType === 'evm' ? 'text-[#676FFF]' : 'text-[#9945FF]'}>
        {chainType === 'evm' ? 'EVM' : 'SOL'}
      </span>
      <svg
        className="w-3 h-3 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
        />
      </svg>
    </button>
  );
}
