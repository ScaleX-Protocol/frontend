# Metro Bundler Configuration for Monorepo

## Changes Made

### 1. Metro Configuration (`metro.config.js`)
- Added `watchFolders` to watch the entire monorepo
- Configured `nodeModulesPaths` to resolve from both mobile app and workspace root
- Added `sourceExts` to ensure Metro can resolve TypeScript files
- Implemented dynamic `extraNodeModules` using a Proxy to resolve `@scalex/*` packages

### 2. Package.json Updates
All shared packages now include:
- `"react-native": "src/index.ts"` - tells Metro to use source files for React Native
- `"exports"` field - modern package entry point configuration

Updated packages:
- `@scalex/api-client`
- `@scalex/base-utils`
- `@scalex/types`
- `@scalex/persist-store`
- `@scalex/service-wallet`
- `@scalex/service-lending`
- `@scalex/service-trading`

### 3. Babel Configuration (`babel.config.js`)
- Module resolver configured for `~/` alias (local paths only)
- NativeWind preset for Tailwind CSS support

## How to Run

1. **Clean start** (recommended after configuration changes):
   ```bash
   cd /Users/renakaagusta/Documents/scalex/frontend/apps/mobile
   pnpm start --clear
   ```

2. **Regular start**:
   ```bash
   cd /Users/renakaagusta/Documents/scalex/frontend/apps/mobile
   pnpm dev
   ```

## Troubleshooting

If you still see module resolution errors:

1. **Clear all caches**:
   ```bash
   rm -rf node_modules/.cache
   rm -rf .expo
   pnpm start --clear
   ```

2. **Reinstall dependencies**:
   ```bash
   pnpm install
   ```

3. **Check Metro is using the config**:
   Add `console.log('Metro config loaded')` to the top of `metro.config.js` to verify it's being read.

## Known Issues

- Some peer dependency warnings are expected (React 19 vs React 18, expo-crypto versions)
- These warnings don't affect functionality
