# Test Organization

This directory contains Playwright tests organized by feature areas:

## Directory Structure

### `/api/`
- **API endpoint testing**: Tests for backend API functionality
- **Symbol switching**: Tests related to symbol/asset switching functionality
- **Debug tests**: Console logging and debugging tests

**Files:**
- `api-endpoints.spec.js` - Core API endpoint testing
- `api-export.spec.js` - API export functionality testing
- `api-debug-simple.spec.js` - Simple API debugging tests
- `symbol-switch-*.spec.js` - Various symbol switching test scenarios
- `console-debug.spec.js` - Console log debugging
- `quick-debug.spec.js` - Quick debugging tests

### `/faucet/`
- **Faucet functionality**: Tests for the token faucet feature

**Files:**
- `faucet-api-call.spec.js` - Tests faucet API calls without wallet connection

### `/trade/`
- **Trading interface**: Tests for the main trading UI and functionality

**Files:**
- `trade-page.spec.js` - Main trade page functionality
- `trades-tab.spec.js` - Trades tab display and interaction
- `symbol-selector.spec.js` - Symbol selector component testing
- `page-content.spec.js` - Page content verification
- `default-market.spec.js` - Default market behavior

### `/auth/`
- **Authentication**: Tests for user authentication flows

**Files:**
- `privy-login.spec.js` - Comprehensive Privy authentication testing
- `README.md` - Auth test documentation and setup guide

### `/lending/` *(empty - ready for lending tests)*
- **Lending features**: Tests for lending/borrowing functionality

### `/websocket/`
- **WebSocket connections**: Tests for WebSocket connection stability and behavior

**Files:**
- `websocket-connection.spec.js` - Connection establishment, reconnection detection, message handling
- `README.md` - WebSocket test documentation and troubleshooting guide

## Running Tests

To run tests for a specific feature:
```bash
# Run all API tests
npx playwright test tests/api/

# Run all faucet tests
npx playwright test tests/faucet/

# Run all trade tests
npx playwright test tests/trade/

# Run all auth tests
npx playwright test tests/auth/

# Run all WebSocket tests
npx playwright test tests/websocket/

# Run all tests
npx playwright test tests/
```

## Test Naming Convention

Tests follow the pattern `{feature}-{functionality}.spec.js` for easy identification and maintenance.