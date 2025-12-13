# DataTable Component Usage

This directory contains a reusable `DataTable` component built with TanStack Table that can be used for trade history, open orders, and balances.

## Components

- **`dataTable.tsx`** - Reusable DataTable component
- **`tradeHistory/column.tsx`** - Column definitions for trade history
- **`openOrders/column.tsx`** - Column definitions for open orders
- **`balances/column.tsx`** - Column definitions for balances

## Usage Examples

### Trade History

```tsx
import { DataTable } from '@/features/trade/components/history/dataTable';
import { getTradeHistoryColumns } from '@/features/trade/components/history/tradeHistory/column';
import { useTrades } from '@/features/trade/hooks/history/useTrades';

export default function TradeHistory({ symbol }: { symbol: string }) {
  const { data, isLoading, error } = useTrades({ symbol, limit: 10 });
  const columns = getTradeHistoryColumns(symbol);

  return (
    <DataTable
      columns={columns}
      data={data || []}
      isLoading={isLoading}
      error={error}
      emptyMessage="No trade history found"
      loadingMessage="Loading trade history..."
      errorMessage="Error loading trade history"
      getRowId={(row) => row.id}
    />
  );
}
```

### Open Orders

```tsx
import { DataTable } from '@/features/trade/components/history/dataTable';
import { getOpenOrdersColumns } from '@/features/trade/components/history/openOrders/column';
import { useAllOrders } from '@/features/trade/hooks/history/useAllOrders';

export default function OpenOrders({ symbol }: { symbol: string }) {
  const { data, isLoading, error } = useAllOrders({ symbol, limit: 10 });
  const columns = getOpenOrdersColumns(symbol, 18, 6); // baseDecimals, quoteDecimals

  return (
    <DataTable
      columns={columns}
      data={data || []}
      isLoading={isLoading}
      error={error}
      emptyMessage="No orders found"
      loadingMessage="Loading orders..."
      errorMessage="Error loading orders"
      getRowId={(row) => row.orderId}
    />
  );
}
```

### Balances

```tsx
import { DataTable } from '@/features/trade/components/history/dataTable';
import { getBalancesColumns } from '@/features/trade/components/history/balances/column';
import { useAccount } from '@/features/trade/hooks/history/useAccount';

export default function Balances() {
  const { data, isLoading, error } = useAccount(address);
  const balances = data?.balances?.filter(b => b.total > 0) || [];
  const totalPortfolioValue = balances.reduce((sum, b) => sum + b.usdValue, 0);
  const columns = getBalancesColumns(totalPortfolioValue);

  return (
    <DataTable
      columns={columns}
      data={balances}
      isLoading={isLoading}
      error={error}
      emptyMessage="No balances found"
      loadingMessage="Loading balances..."
      errorMessage="Error loading balances"
      getRowId={(row) => row.token}
    />
  );
}
```

## Column Alignment

Columns support alignment via the `meta.align` property:
- `"left"` - Left aligned (default)
- `"right"` - Right aligned
- `"center"` - Center aligned

## Features

- ✅ Loading states
- ✅ Error states
- ✅ Empty states
- ✅ Customizable messages
- ✅ Row hover effects
- ✅ Responsive design
- ✅ Type-safe with TypeScript
- ✅ Column alignment support

