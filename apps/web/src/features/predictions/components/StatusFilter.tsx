import { MarketStatus } from '../types/prediction.types';

interface StatusFilterProps {
  value: MarketStatus | undefined;
  onChange: (v: MarketStatus | undefined) => void;
}

const OPTIONS: { label: string; value: MarketStatus | undefined }[] = [
  { label: 'Open', value: MarketStatus.Open },
  { label: 'Settling', value: MarketStatus.SettlementRequested },
  { label: 'Settled', value: MarketStatus.Settled },
  { label: 'All', value: undefined },
];

export default function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex gap-1">
      {OPTIONS.map(opt => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`text-[11px] px-2.5 py-1 rounded-[6px] transition-colors ${
            value === opt.value
              ? 'bg-[#F06718]/10 text-[#F06718] border border-[#F06718]/20'
              : 'text-[#808080] hover:bg-[#1A1A1A] hover:text-[#E0E0E0]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
