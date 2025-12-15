# ScaleX Shared Packages

This directory contains shared packages following the Uniswap/Rabby monorepo pattern for code sharing between web and mobile applications.

## 📦 Package Structure

```
packages/
├── @scalex/base-utils/      ✅ Created - Foundation utilities
├── @scalex/types/           ✅ Created - Shared TypeScript types
├── @scalex/persist-store/   ✅ Created - Platform-agnostic storage
├── @scalex/api-client/      ✅ Created - API clients & WebSocket
├── @scalex/service-wallet/  ✅ Created - Wallet services
├── @scalex/service-trading/ ✅ Created - Trading services
└── @scalex/service-lending/ ✅ Created - Lending services
```

## 🔄 Dependency Graph

```
        apps/web, apps/mobile
               │
    ┌──────────┴──────────┐
    │                     │
service-trading    service-lending
    │                     │
    └──────────┬──────────┘
               │
        service-wallet
               │
          api-client
               │
         persist-store
               │
      ┌────────┴────────┐
  base-utils         types
```

## 📋 Package Details

### @scalex/base-utils
**Purpose:** Foundation utilities used across all packages
**Contents:**
- `format/` - Token amount, price, address, time formatting
- `validation/` - Input validation, schema validators
- `web3/` - Web3 utilities, gas estimation, address handling
- `common/` - Array, object, string, async utilities

**Dependencies:** `viem`, `zod`

### @scalex/types
**Purpose:** Shared TypeScript type definitions
**Contents:**
- `currency.ts` - Currency, Token types
- `wallet.ts` - Wallet state, chain validation types
- `modal.ts` - Modal prop types

**Dependencies:** `@privy-io/react-auth`

### @scalex/persist-store
**Purpose:** Platform-agnostic storage layer
**Status:** Structure created, needs implementation
**TODO:**
- [ ] Implement web storage (localStorage)
- [ ] Implement mobile storage (MMKV/AsyncStorage)
- [ ] Create unified storage interface

### @scalex/api-client
**Purpose:** Centralized API communication
**Status:** Structure created, needs migration
**TODO:**
- [ ] Move `apps/web/src/hooks/fetchIndexer.ts` → `src/indexer/`
- [ ] Move `apps/web/src/hooks/fetchAPI.ts` → `src/backend/`
- [ ] Move `apps/web/src/managers/websocketManager.ts` → `src/websocket/`

### @scalex/service-wallet
**Purpose:** Wallet management and chain validation
**Status:** Structure created, needs migration
**TODO:**
- [ ] Move `apps/web/src/hooks/useWalletState.ts` → `src/hooks/`
- [ ] Move `apps/web/src/hooks/useChainValidator.ts` → `src/hooks/`
- [ ] Move `apps/web/src/hooks/useCurrencies.ts` → `src/hooks/`
- [ ] Move `apps/web/src/configs/chain.ts` → `src/configs/`
- [ ] Move `apps/web/src/configs/contracts.ts` → `src/configs/`
- [ ] Move `apps/web/src/configs/tokens.ts` → `src/configs/`

### @scalex/service-trading
**Purpose:** Trading functionality (markets, orders, swaps)
**Status:** Structure created, needs migration
**TODO:**
- [ ] Move `apps/web/src/features/trade/hooks/` → `src/hooks/`
- [ ] Move `apps/web/src/features/trade/utils/` → `src/utils/`
- [ ] Move `apps/web/src/features/trade/types/` → Move to `@scalex/types`
- [ ] Move `apps/web/src/configs/trading.ts` → `src/configs/`

### @scalex/service-lending
**Purpose:** Lending functionality (supply, borrow, repay)
**Status:** Structure created, needs migration
**TODO:**
- [ ] Move `apps/web/src/features/lending/hooks/` → `src/hooks/`
- [ ] Move `apps/web/src/features/home/hooks/` (deposit/withdraw) → `src/hooks/`
- [ ] Move `apps/web/src/utils/*Utils.ts` → `src/utils/`
- [ ] Move `apps/web/src/features/lending/types/` → Move to `@scalex/types`

## 🚀 Next Steps

### Phase 1: Complete Package Migration (Current)
1. ✅ Create package structures
2. ✅ Move types to `@scalex/types`
3. ✅ Move base utilities to `@scalex/base-utils`
4. ⏳ Implement persist-store
5. ⏳ Move API clients
6. ⏳ Move service packages (wallet, trading, lending)

### Phase 2: Update Web App
1. Update imports from `@/` to `@scalex/*`
2. Test all functionality
3. Remove old files

### Phase 3: Implement Mobile
1. Import shared packages in mobile app
2. Build mobile-specific UI components
3. Test cross-platform compatibility

## 📖 Usage

### In Web App
```typescript
// Before
import { formatTokenAmount } from '@/core/utils/format';
import { useLendingDashboard } from '@/features/lending/hooks/useLendingDashboard';
import type { Currency } from '@/types/currency.types';

// After
import { formatTokenAmount } from '@scalex/base-utils';
import { useLendingDashboard } from '@scalex/service-lending';
import type { Currency } from '@scalex/types';
```

### In Mobile App
```typescript
// Same imports work on mobile!
import { formatTokenAmount } from '@scalex/base-utils';
import { useLendingDashboard } from '@scalex/service-lending';
import type { Currency } from '@scalex/types';

// Platform-specific UI
import { View, Text } from 'react-native';
```

## 🔗 References

- [Uniswap Interface](https://github.com/Uniswap/interface) - Monorepo structure inspiration
- [Rabby Mobile](https://github.com/RabbyHub/rabby-mobile) - Service package pattern
- [Safe Wallet Monorepo](https://github.com/safe-global/safe-wallet-monorepo) - Yarn workspaces

## 📝 Contributing

When adding new shared code:
1. Determine correct package (utils → base-utils, hooks → service-*)
2. Ensure no platform-specific code (no DOM, no React Native APIs)
3. Add exports to package's `index.ts`
4. Update this README if adding new packages

## ⚠️ Important Notes

- **No platform-specific code** in shared packages
- **No UI components** in shared packages (only logic/hooks)
- **Types** should be in `@scalex/types` not individual packages
- **Chain config** is passed as parameter to avoid circular dependencies
