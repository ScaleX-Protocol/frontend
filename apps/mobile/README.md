# ScaleX Mobile App

React Native mobile app for ScaleX DeFi platform built with Expo.

## Setup Complete ✅

- ✅ Expo + React Native with TypeScript
- ✅ Expo Router with tab navigation (Home, Trade, Lending, Faucet)
- ✅ NativeWind (Tailwind CSS for React Native)
- ✅ Privy Expo SDK for wallet authentication
- ✅ Wagmi + Viem for Web3 interactions
- ✅ React Query for data fetching
- ✅ MMKV for fast storage
- ✅ React Hook Form + Zod for forms
- ✅ Victory Native + WebView for charts

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- iOS Simulator (Mac) or Android Emulator

### Install Dependencies
```bash
cd apps/mobile
pnpm install
```

### Run Development Server
```bash
pnpm dev
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## Environment Variables

Copy `.env` and update with your values:

```env
EXPO_PUBLIC_PRIVY_APP_ID=your_privy_app_id
EXPO_PUBLIC_API_URL=https://base-sepolia-api.scalex.money
EXPO_PUBLIC_INDEXER_URL=https://base-sepolia-indexer.scalex.money
EXPO_PUBLIC_WEBSOCKET_URL=wss://base-sepolia-websocket.scalex.money
EXPO_PUBLIC_CHAIN_ID=84532
```

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx         # Root layout with providers
│   └── (tabs)/             # Tab navigation
│       ├── index.tsx       # Home screen
│       ├── trade.tsx       # Trade screen
│       ├── lending.tsx     # Lending screen
│       └── faucet.tsx      # Faucet screen
├── providers/              # React providers
│   ├── index.tsx           # Combined providers
│   ├── privyProvider.tsx   # Privy + Wagmi + React Query
│   └── storageProvider.tsx # MMKV storage
├── src/                    # Source code (to be populated)
│   ├── components/         # UI components
│   ├── configs/            # Configuration files
│   ├── hooks/              # Custom hooks
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── assets/                 # Images, fonts, etc.
├── global.css              # Tailwind styles
├── tailwind.config.js      # Tailwind configuration
└── babel.config.js         # Babel configuration
```

## Next Steps

### 1. Copy Shared Code from Web App
- Copy `/src/configs/*` → `/apps/mobile/src/configs/*`
- Copy `/src/types/*` → `/apps/mobile/src/types/*`
- Copy `/src/utils/*` → `/apps/mobile/src/utils/*`
- Copy `/src/hooks/*` → `/apps/mobile/src/hooks/*`
- Copy `/src/features/*/hooks/*` → `/apps/mobile/src/features/*/hooks/*`

### 2. Build UI Components
- Create mobile Button, Input, Card components with NativeWind
- Build mobile versions of forms (PlaceOrder, Deposit, Withdraw, etc.)
- Implement dual chart options (TradingView WebView + Victory Native)

### 3. Implement Screens
- **Home**: Portfolio, balances, deposit/withdraw
- **Trade**: Charts, order book, place orders, history
- **Lending**: Borrow/repay forms, positions, interest rates
- **Faucet**: Token requests, history

### 4. Testing
- Test wallet connection with Privy
- Test Web3 transactions
- Test on iOS and Android

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm android` - Run on Android
- `pnpm ios` - Run on iOS
- `pnpm typecheck` - Type check with TypeScript

## Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **Wallet**: Privy Expo SDK
- **Web3**: Wagmi + Viem
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **Storage**: MMKV
- **Charts**: Victory Native + WebView

## Notes

- Web app code stays untouched in `/src`
- Mobile app is completely separate in `/apps/mobile`
- Shared code will be extracted to `/packages/shared` in the future
- Currently targeting iOS and Android (no web)
