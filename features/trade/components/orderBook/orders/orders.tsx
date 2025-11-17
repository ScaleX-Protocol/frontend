import { useDepth, type UseDepthParams } from '@/features/trade/hooks/chart/useDepth';

export default function Orders({ symbol }: { symbol: string }) {
  const params: UseDepthParams = {
    symbol: symbol,
    limit: 10,
  };

  const { data, isLoading, error } = useDepth(params);

  if (isLoading || error || !data) {
    console.log('error depth data');
    // Place to handler error depth data
  };

  console.log(data);

  return <div className="h-full flex flex-col"></div>;
}
