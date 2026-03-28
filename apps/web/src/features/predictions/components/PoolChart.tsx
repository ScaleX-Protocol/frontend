interface PoolChartProps {
  upPct: number;
  downPct: number;
  size?: number;
}

export default function PoolChart({ upPct, downPct, size = 120 }: PoolChartProps) {
  const isEmpty = upPct === 50 && downPct === 50;
  // Ensure minimum visual width of 5% for the minority side
  const visualUp = isEmpty ? 50 : Math.max(5, Math.min(95, upPct));
  const visualDown = 100 - visualUp;

  const gradient = isEmpty
    ? 'conic-gradient(#333333 0% 100%)'
    : `conic-gradient(#4CAF50 0% ${visualUp}%, #F44336 ${visualUp}% 100%)`;

  const innerSize = size * 0.65;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Donut ring */}
      <div
        className="rounded-full relative"
        style={{
          width: size,
          height: size,
          background: gradient,
        }}
      >
        {/* Inner hole */}
        <div
          className="absolute bg-[#0C0C0C] rounded-full flex flex-col items-center justify-center"
          style={{
            width: innerSize,
            height: innerSize,
            top: (size - innerSize) / 2,
            left: (size - innerSize) / 2,
          }}
        >
          {isEmpty ? (
            <span className="text-[#606060] text-[10px]">No stakes</span>
          ) : (
            <>
              <span className={`text-[16px] font-bold ${upPct >= downPct ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>
                {upPct >= downPct ? upPct : downPct}%
              </span>
              <span className="text-[10px] text-[#808080]">
                {upPct >= downPct ? 'UP' : 'DOWN'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#4CAF50]" />
          <span className="text-[#4CAF50] font-medium">UP {upPct}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#F44336]" />
          <span className="text-[#F44336] font-medium">DOWN {downPct}%</span>
        </div>
      </div>
    </div>
  );
}
