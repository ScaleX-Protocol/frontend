export default function OrdersSkeleton() {
  const askWidths = [45, 65, 30, 55, 40];
  const bidWidths = [75, 80, 60, 45, 65];

  const asksSkeleton = Array.from({ length: 5 }, (_, index) => ({
    id: `ask-skeleton-row-${index}`,
    width: askWidths[index],
  }));

  const bidsSkeleton = Array.from({ length: 5 }, (_, index) => ({
    id: `bid-skeleton-row-${index}`,
    width: bidWidths[index],
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center self-end py-2">
        <div className="relative">
          <div className="w-16 h-8 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-3 py-2 text-sm text-[#E0E0E0] border-y border-[#E0E0E0]/20">
        <div>Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="relative">
          {asksSkeleton.map((row) => (
            <div key={`ask-skeleton-${row.id}`} className="relative group">
              <div
                className="absolute right-0 top-0 h-full bg-gray-700/20 animate-pulse"
                style={{ width: `${row.width}%` }}
              ></div>

              <div className="relative grid grid-cols-3 py-1 text-sm">
                <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-16 ml-auto animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-16 ml-auto animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-b border-[#E0E0E0]/20">
          <div className="py-2 flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-6 w-24 bg-gray-700 rounded animate-pulse mr-2"></div>
              <div className="h-4 w-4 bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center text-sm">
              <div className="h-4 w-12 bg-gray-700 rounded animate-pulse mr-2"></div>
              <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="relative">
          {bidsSkeleton.map((row) => (
            <div key={`bid-skeleton-${row.id}`} className="relative group">
              <div
                className="absolute right-0 top-0 h-full bg-gray-700/20 animate-pulse"
                style={{ width: `${row.width}%` }}
              ></div>

              <div className="relative grid grid-cols-3 py-1 text-sm">
                <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-16 ml-auto animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-16 ml-auto animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
