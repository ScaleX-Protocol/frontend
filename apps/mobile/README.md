## ScaleX Mobile App

This folder contains the **ScaleX Solana mobile client**, built with **React Native + Expo Router**. It is responsible for the main user flows (Home, Trade, Lending, Borrow / Deposit / Withdraw / Repay) and talks to the ScaleX indexer and trading APIs via the shared `@scalex` packages.

### Tech Stack

- **App framework**: Expo / React Native
- **Navigation**: `expo-router` (file-based routing in `app/`)
- **State / data fetching**: `@tanstack/react-query` (indirectly via `@scalex/api` hooks)
- **API clients**: `@scalex/api`, `@scalex/config`, `@scalex/types`

### Project Structure (high level)

- `app/`
  - `(tabs)/_layout.tsx` – bottom tab navigator (Home, Trade, Lending)
  - `(tabs)/index.tsx` – Home screen
  - `(tabs)/trade.tsx` – Trade screen (chart, place order, history) using `useMarkets` and other `@scalex/api` hooks
  - `borrow/index.tsx`, `deposit/index.tsx`, `withdraw/index.tsx`, `repay/index.tsx` – lending-related flows
- `src/components/`
  - `trade/` – `MarketHeader`, `Chart`, `PlaceOrder`, `History`, order book, etc.
  - `shared/` – shared UI like `AppHeader`
- `src/hooks/` – app-level hooks (e.g. trading, deposit, wallet)
- `src/lib/` – utilities such as Solana helpers (`marketSymbolToPool`, etc.)

### Environment & Endpoints

The mobile app uses `@scalex/config` to resolve API and WebSocket endpoints from environment variables. On Expo / React Native you typically provide:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_INDEXER_URL`
- `EXPO_PUBLIC_WS_URL`

If these are not set, **safe defaults** (devnet endpoints) from `@scalex/config` are used.

#### Example (app config)

Configure your Expo app (e.g. `app.config.(ts|js)` or `.env`) to include:

```bash
EXPO_PUBLIC_API_URL=https://solana-devnet-indexer.scalex.money
EXPO_PUBLIC_INDEXER_URL=https://solana-devnet-indexer.scalex.money
EXPO_PUBLIC_WS_URL=wss://solana-devnet-ws.scalex.money/ws
```

### Running the App

From the monorepo root (or `apps/mobile` depending on your setup):

```bash
# install dependencies
pnpm install

# start Metro / Expo dev server for mobile
pnpm dev:mobile        # or check package.json for the exact script name
```

Then open:

- **iOS**: Expo Go on a simulator or physical device
- **Android**: Expo Go or Android emulator

### Trade Flow Overview

- The Trade tab (`app/(tabs)/trade.tsx`) uses:
  - `useMarkets()` from `@scalex/api` to load markets from the indexer
  - `MarketHeader` to select / favorite a market
  - `Chart` to show Klines
  - `PlaceOrder` to place limit/market orders using `usePrivyPlaceOrder`
  - `History` to show user activity
- `PlaceOrder` integrates:
  - Wallet balances via `useTokenBalance`
  - Market metadata (`MarketInfo`) such as decimals and symbols
  - Order placement (limit / market, buy / sell, percentage-of-balance quick actions)

### Lending Flow Overview

Borrow / deposit / withdraw / repay screens under `app/` rely on:

- Lending hooks from `@scalex/api` (e.g. `useLendingDashboard`)
- Wallet and token helpers in `src/hooks` and `src/lib`

They follow the same pattern as Trade: fetch data with `@scalex/api` hooks, then render tailored React Native UIs for each action.

### Development Notes

- **Styling**: mostly done with `StyleSheet.create` and dark theme colors (black background, orange accent `#E26B1D`).
- **Safe areas**: `react-native-safe-area-context` is used in `_layout.tsx` and screens.
- **React Query cache**: shared between screens via the app-wide React Query provider (configured higher up in the tree).

If you add new screens:

1. Create a new file in `app/` (or under `(tabs)/`).
2. Wire up any needed hooks from `@scalex/api`.
3. Follow existing patterns in `trade.tsx` / lending screens for styling and layout.

