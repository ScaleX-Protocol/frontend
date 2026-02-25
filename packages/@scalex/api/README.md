## @scalex/api

Typed client + React Query hooks for the **ScaleX Solana indexer / trading / lending APIs**.  
This package is used by the mobile and web apps to load markets, depth, klines, account info and more.

### Features

- **Indexer client**: thin wrapper around `fetch` with a configurable base URL.
- **React hooks** (powered by `@tanstack/react-query`):
  - `useMarkets`, `usePairs`, `useTickerPrice`, `useTicker24hr`
  - `useDepth`, `useOrderBookRealtime`, `useTrades`, `useKlines`, `useKlineRealtime`
  - `useAccount`, `useOpenOrders`, `useAllOrders`
  - `useLendingDashboard`
- **Services**:
  - `TradingService` – REST helpers for trading data (markets, depth, trades, klines, tickers, orders, account).
  - `LendingService` – lending-related endpoints.
  - `CommonService` – shared / misc API calls.
- **Socket manager**:
  - `SocketManager` (and helpers) to handle WebSocket subscriptions for real‑time feeds.

### Installation

In the monorepo this package is already wired via workspaces.  
If you need to add it to another package in the repo:

```bash
pnpm add @scalex/api
```

Make sure the consumer app also has:

- `@tanstack/react-query`
- `@scalex/config`
- `@scalex/types`

### Endpoint Configuration

`@scalex/api` relies on `@scalex/config` to determine the correct base URLs.  
The default `IndexerClient` uses `getEndpoints` under the hood, which reads from env-like objects:

- Web: `VITE_API_URL`, `VITE_INDEXER_API_URL`, `VITE_WS_URL`, etc.
- Mobile: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_INDEXER_URL`, `EXPO_PUBLIC_WS_URL`

If none are set, devnet defaults from `@scalex/config` are used.

You can also create your own client:

```ts
import { IndexerClient } from '@scalex/api';
import { createEndpoints } from '@scalex/config';

const endpoints = createEndpoints({
  apiUrl: 'https://solana-devnet-indexer.scalex.money',
  indexerUrl: 'https://solana-devnet-indexer.scalex.money',
  wsUrl: 'wss://solana-devnet-ws.scalex.money/ws',
});

export const customClient = new IndexerClient(endpoints.indexerUrl);
```

### Basic Usage (hooks)

`@scalex/api` is designed to be used with a React Query provider at the app root:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

Then in a screen or component:

```tsx
import { useMarkets } from '@scalex/api';

export function MarketsList() {
  const { data: markets, isLoading, error } = useMarkets();

  if (isLoading) return null;
  if (error) return null;

  return (
    <>
      {markets?.map((m) => (
        <Text key={m.poolId}>{m.baseAsset}/{m.quoteAsset}</Text>
      ))}
    </>
  );
}
```

### Using the Services Directly

If you prefer to bypass the hooks (for non-React environments, background jobs, etc.) you can use the service layer:

```ts
import { TradingService, IndexerClient } from '@scalex/api';

const client = new IndexerClient('https://solana-devnet-indexer.scalex.money');

async function loadMarkets() {
  const markets = await TradingService.getMarkets(client);
  console.log(markets[0]);
}
```

Example `TradingService` endpoints:

- `getMarkets(client)`
- `getPairs(client)`
- `getDepth(client, symbol, limit?)`
- `getTrades(client, symbol, limit?)`
- `getTicker24hr(client, symbol)`
- `getKlines(client, symbol, interval, limit?)`
- `getOpenOrders(client, symbol, user)`
- `getAllOrders(client, symbol, user)`
- `getAccount(client, user)`

Lending and common services follow a similar pattern.

### Real‑time Data

For real‑time feeds (order book, trades, klines) you can:

- Use the `useOrderBookRealtime`, `useKlineRealtime`, etc. hooks where available; or
- Work with the exported socket utilities (`SocketManager`) to subscribe to WebSocket channels manually.

These rely on the `wsUrl` from `@scalex/config`, typically `EXPO_PUBLIC_WS_URL` / `VITE_WS_URL`.

### Conventions

- All responses are typed using `@scalex/types`.
- Query keys for React Query are short and stable (e.g. `['markets']`, `['klines', symbol, interval]`).
- New endpoints should:
  - Be added to the relevant service (`trading.service.ts`, `lending.service.ts`, or `common.service.ts`).
  - Optionally expose a hook wrapper under `src/hooks/` and re-exported from `src/index.ts`.

