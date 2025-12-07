# Enhanced Frontend Logging System

This document explains how to use the enhanced logging system that provides comprehensive logging with automatic wallet context inclusion.

## Features

- **Automatic Wallet Context**: Includes user address, embedded wallet address, email, and user ID in all logs
- **Browser Context**: Captures user agent, URL, and online status
- **Structured Logging**: Consistent format with timestamps, service names, and labels
- **Multiple Log Levels**: DEBUG, INFO, WARN, ERROR
- **Specialized Logging**: Transaction logging, contract interactions, user actions
- **Error Context**: Enhanced error logging with stack traces and context
- **External Service Integration**: Optional integration with logging services

## Quick Start

### 1. Using the useLogger Hook (Recommended)

```tsx
'use client';

import { useLogger } from '@/hooks/useLogger';

function MyComponent() {
  const logger = useLogger();

  const handleClick = () => {
    // Log user action with automatic wallet context
    logger.logButtonClick('submit_form', { formId: 'contact' });

    try {
      // Your code here
      logger.info('Action completed successfully', { result: 'success' });
    } catch (error) {
      logger.error('Action failed', error);
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### 2. Using the Logger Utility Directly

```ts
import { logger, LogLevel, LogLabel, ServiceName } from '@/utils/logger';

// Set wallet context (usually done after wallet connection)
logger.setWalletContext({
  userAddress: '0x1234...5678',
  embeddedWalletAddress: '0x9876...5432',
  email: 'user@example.com',
  userId: 'user_123'
});

// Basic logging
logger.info('User logged in', { timestamp: Date.now() }, 'loginHandler', 'auth.ts');

// Error logging
logger.error('Login failed', error, 'loginHandler', 'auth.ts');

// Advanced logging with custom parameters
logger.log(
  LogLevel.INFO,
  'Custom message',
  LogLabel.USER,
  ServiceName.WEBAPP,
  { customData: 'value' },
  'component.tsx',
  'customFunction'
);
```

## Log Levels

### DEBUG
Detailed information for debugging purposes:

```tsx
logger.debug('Function parameters', { params: input }, 'validateInput', 'utils.ts');
```

### INFO
General information about application flow:

```tsx
logger.info('Transaction submitted', { txHash: '0x123...' }, 'handleTransaction', 'useDeposit.ts');
```

### WARN
Warning messages that don't prevent the application from continuing:

```tsx
logger.warn('Low balance detected', { balance: '0.001 ETH' }, 'checkBalance', 'useBalance.ts');
```

### ERROR
Error messages with context and stack traces:

```tsx
logger.error('Transaction failed', error, 'handleTransaction', 'useDeposit.ts');
```

## Specialized Logging Functions

### User Actions
Track user interactions throughout the application:

```tsx
// Button clicks
logger.logButtonClick('submit_order', { orderId: '123' });

// Form submissions
logger.logFormSubmit('contact_form', { name: 'John Doe' });

// Navigation
logger.logNavigation('/trade', '/home');

// Modal interactions
logger.logModalOpen('deposit_modal', 'wallet_button');
logger.logModalClose('deposit_modal', 'completed');
```

### Transaction Logging
Track blockchain transactions throughout their lifecycle:

```tsx
// Transaction start
logger.logTransactionStart('deposit', { amount: '100 USDC' });

// Transaction success
logger.logTransactionSuccess('deposit', txHash, { gasUsed: '21000' });

// Transaction error
logger.logTransactionError('deposit', error, { errorType: 'insufficient_funds' });
```

### Contract Interactions
Log smart contract function calls:

```tsx
logger.logContractInteraction(
  'BalanceManager',
  'deposit',
  { token: 'USDC', amount: '100' },
  { success: true, txHash: '0x123...' },
  true // success flag
);
```

## Automatic Context

The logging system automatically includes the following context in every log entry:

### Wallet Context
- `userAddress`: The connected wallet address (e.g., `0x1234...5678`)
- `embeddedWalletAddress`: Privy embedded wallet address
- `email`: User email (if available)
- `userId`: Unique user identifier

### Browser Context
- `userAgent`: Browser user agent string
- `url`: Current page URL
- `online`: Browser online status

## Log Output Format

```json
{
  "timestamp": "2024-12-06T10:30:45.123Z",
  "service": "frontend",
  "label": "user",
  "filename": "useDeposit.ts",
  "function": "deposit",
  "message": "Transaction started",
  "data": { "amount": "100" },
  "wallet": {
    "userAddress": "0x1234567890123456789012345678901234567890",
    "embeddedWalletAddress": "0x0987654321098765432109876543210987654321",
    "email": "user@example.com",
    "userId": "user_123"
  },
  "browser": {
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    "url": "https://app.example.com/deposit",
    "online": true
  }
}
```

## Configuration

### Environment Variables

```env
# Enable external logging service integration
NEXT_PUBLIC_ENABLE_EXTERNAL_LOGGING=true

# External logging endpoint
NEXT_PUBLIC_LOGGING_ENDPOINT=https://your-logging-service.com/logs

# Log level (DEBUG, INFO, WARN, ERROR)
NEXT_PUBLIC_LOG_LEVEL=INFO
```

### Labels and Services

```ts
// Available log labels
enum LogLabel {
  API = 'api',
  TRADING = 'trading',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  APPROVAL = 'approval',
  CONTRACT = 'contract',
  BALANCE = 'balance',
  WALLET = 'wallet',
  USER = 'user',
  UI = 'ui',
  SYSTEM = 'system',
  GENERAL = 'general'
}

// Available service names
enum ServiceName {
  FRONTEND = 'frontend',
  WEBAPP = 'webapp',
  TRADING_UI = 'trading-ui',
  DEPOSIT_UI = 'deposit-ui'
}
```

## Best Practices

### 1. Use Appropriate Log Levels
- **DEBUG**: Detailed development information
- **INFO**: Important application events
- **WARN**: Recoverable issues
- **ERROR**: Unrecoverable errors

### 2. Include Relevant Context
Provide meaningful context data:

```tsx
// Good
logger.info('Deposit completed', {
  amount: '100 USDC',
  txHash: '0x123...',
  blockNumber: 12345,
  gasUsed: '21000'
});

// Avoid
logger.info('Done');
```

### 3. Use Specialized Functions
Use specialized logging functions when appropriate:

```tsx
// Good
logger.logTransactionStart('deposit', { amount: '100 USDC' });

// Okay but less descriptive
logger.info('Starting deposit transaction', { amount: '100 USDC' });
```

### 4. Error Handling
Always include error context:

```tsx
try {
  await someAsyncOperation();
  logger.info('Operation completed successfully');
} catch (error) {
  // Include error details and context
  logger.error('Operation failed', error, 'handleOperation', 'MyComponent.tsx');
  throw error;
}
```

### 5. Performance Considerations
- Large objects are automatically truncated
- External logging is non-blocking
- Console logging is always available as fallback

## Migration from console.log

Replace existing console.log calls:

```tsx
// Before
console.log('User clicked button', buttonName);
console.error('API call failed', error);
console.warn('Low balance', balance);

// After
logger.logButtonClick('custom_button', { buttonName });
logger.error('API call failed', error, 'handleApiCall', 'api.ts');
logger.warn('Low balance', { balance }, 'checkBalance', 'useBalance.ts');
```

## Examples

See `/examples/LoggerExample.tsx` for a complete working example demonstrating all logging features.

## External Service Integration

The logging system can be extended to send logs to external services like:

- **Datadog**: Add your API key and configure the endpoint
- **LogRocket**: Logs are automatically captured
- **Sentry**: Use the provided integration
- **Custom endpoints**: Configure via environment variables

```ts
// Custom external logging service
const sendToExternalLogging = (level: LogLevel, logEntry: any) => {
  if (process.env.NEXT_PUBLIC_LOGGING_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_LOGGING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, ...logEntry })
    }).catch(() => {
      // Silently ignore external logging failures
    });
  }
};
```

This enhanced logging system provides comprehensive visibility into your application's behavior while automatically including relevant user and context information.