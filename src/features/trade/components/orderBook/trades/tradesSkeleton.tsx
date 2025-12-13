export default function TradesSkeleton() {
  const skeletonRows = Array.from({ length: 12 }, (_, index) => ({
    id: `skeleton-row-${index}`,
  }));

  return (
    <>
      {skeletonRows.map((row) => (
        <div key={row.id} className="grid grid-cols-3 py-1">
          <div className="h-4 w-3/4 rounded bg-gray-700 animate-pulse"></div>
          <div className="h-4 w-1/2 rounded bg-gray-700 animate-pulse"></div>
          <div className="h-4 w-1/2 rounded bg-gray-700 animate-pulse ml-auto"></div>
        </div>
      ))}
    </>
  );
}
