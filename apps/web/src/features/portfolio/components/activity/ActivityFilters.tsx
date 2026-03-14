"use client";

import type { ActivityFilter, TimePeriodFilter } from "../../types/activity.types";

interface ActivityFiltersProps {
  activeType: ActivityFilter;
  activePeriod: TimePeriodFilter;
  onTypeChange: (type: ActivityFilter) => void;
  onPeriodChange: (period: TimePeriodFilter) => void;
}

const TYPE_FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "trading", label: "Trading" },
  { key: "lending", label: "Lending" },
  { key: "agent", label: "Agents" },
  { key: "prediction", label: "Predictions" },
  { key: "transfer", label: "Transfers" },
];

const PERIOD_FILTERS: { key: TimePeriodFilter; label: string }[] = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "all", label: "All" },
];

export default function ActivityFilters({
  activeType,
  activePeriod,
  onTypeChange,
  onPeriodChange,
}: ActivityFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Type Filters */}
      <div className="flex items-center bg-[#111111] rounded-full p-1 gap-1 border border-[#222222]">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => onTypeChange(filter.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeType === filter.key
                ? "bg-[#F97316] text-white"
                : "text-[#666666] hover:text-[#A0A0A0]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Period Filters */}
      <div className="flex items-center bg-[#111111] rounded-full p-1 gap-1 border border-[#222222]">
        {PERIOD_FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => onPeriodChange(filter.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activePeriod === filter.key
                ? "bg-[#222222] text-white"
                : "text-[#666666] hover:text-[#A0A0A0]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
