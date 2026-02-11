/**
 * Error Handling Usage Examples
 *
 * This file contains practical examples of how to use all error handling components
 */

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

import { useToast } from '~/src/components/shared';
import { View, TouchableOpacity, Text } from 'react-native';

function ToastExamples() {
  const toast = useToast();

  return (
    <View style={{ gap: 16 }}>
      {/* Success Toast */}
      <TouchableOpacity
        onPress={() => toast.show('success', 'Order placed successfully!')}
      >
        <Text>Show Success Toast</Text>
      </TouchableOpacity>

      {/* Error Toast */}
      <TouchableOpacity
        onPress={() => toast.show('error', 'Failed to place order')}
      >
        <Text>Show Error Toast</Text>
      </TouchableOpacity>

      {/* Info Toast */}
      <TouchableOpacity
        onPress={() => toast.show('info', 'Wallet connected')}
      >
        <Text>Show Info Toast</Text>
      </TouchableOpacity>

      {/* Custom Duration */}
      <TouchableOpacity
        onPress={() =>
          toast.show('success', 'This will show for 5 seconds')
        }
      >
        <Text>Show Long Toast</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

import {
  FormValidator,
  ValidationRules,
  InputWithError,
} from '~/src/components/shared';

function FormValidationExample() {
  return (
    <FormValidator>
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        validateAll,
        resetForm,
      }) => {
        const handleSubmit = () => {
          const isValid = validateAll();
          if (isValid) {
            console.log('Form is valid:', values);
            // Submit form
          } else {
            console.log('Form has errors:', errors);
          }
        };

        return (
          <View style={{ gap: 16 }}>
            {/* Required Field */}
            <InputWithError
              label="Amount *"
              error={errors.amount}
              showError={touched.amount}
              value={values.amount || ''}
              onChangeText={handleChange('amount')}
              onBlur={handleBlur('amount')}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
            />

            {/* Email Field */}
            <InputWithError
              label="Email *"
              error={errors.email}
              showError={touched.email}
              value={values.email || ''}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Numeric Range */}
            <InputWithError
              label="Price (min 0.001)"
              error={errors.price}
              showError={touched.price}
              value={values.price || ''}
              onChangeText={handleChange('price')}
              onBlur={handleBlur('price')}
              placeholder="Enter price"
              keyboardType="decimal-pad"
            />

            {/* Submit Button */}
            <TouchableOpacity onPress={handleSubmit}>
              <Text>Submit</Text>
            </TouchableOpacity>

            {/* Reset Button */}
            <TouchableOpacity onPress={resetForm}>
              <Text>Reset Form</Text>
            </TouchableOpacity>
          </View>
        );
      }}
    </FormValidator>
  );
}

// Form with validation rules defined
function FormWithRulesExample() {
  const [fields, setFields] = React.useState({
    email: {
      value: '',
      rules: [
        ValidationRules.required('Email is required'),
        ValidationRules.email('Invalid email address'),
      ],
    },
    amount: {
      value: '',
      rules: [
        ValidationRules.required('Amount is required'),
        ValidationRules.numeric('Amount must be a number'),
        ValidationRules.positiveNumber('Amount must be positive'),
      ],
    },
  });

  // Would integrate with FormValidator
  return null;
}

// ============================================================================
// NETWORK ERROR HANDLING
// ============================================================================

import {
  fetchWithRetry,
  fetchWithRetryAndCache,
  isNetworkError,
} from '~/src/lib/network-error-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Example 1: Simple retry with exponential backoff
async function loadMarketsWithRetry() {
  const result = await fetchWithRetry(
    async () => {
      const response = await fetch('https://api.example.com/markets');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    {
      maxRetries: 4,
      baseDelay: 1000,
      maxDelay: 8000,
      showRetryToast: true,
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt}:`, error.message);
      },
    }
  );

  if (result.error) {
    console.error('Failed after all retries:', result.error);
    return null;
  }

  return result.data;
}

// Example 2: Fetch with cache fallback
async function loadBalanceWithCache() {
  const result = await fetchWithRetryAndCache(
    'https://api.example.com/balance',
    'user-balance-cache',
    AsyncStorage,
    undefined,
    {
      maxRetries: 4,
      showRetryToast: true,
    }
  );

  if (result.data) {
    console.log('Balance loaded:', result.data);
    return result.data;
  }

  return null;
}

// Example 3: Check if error is network-related
async function handleApiCall() {
  try {
    const response = await fetch('https://api.example.com/data');
    return await response.json();
  } catch (error) {
    if (isNetworkError(error as Error)) {
      // Show network-specific error
      console.log('Network error detected');
      // Retry logic could go here
    } else {
      // Other types of errors
      console.log('Non-network error:', error);
    }
    return null;
  }
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

import { ErrorBoundary } from '~/src/components/shared';
import { View, Text } from 'react-native';

function MyComponent() {
  // This component might throw errors
  const [shouldThrow, setShouldThrow] = React.useState(false);

  if (shouldThrow) {
    throw new Error('Something went wrong!');
  }

  return (
    <View>
      <Text>My Component</Text>
      <TouchableOpacity onPress={() => setShouldThrow(true)}>
        <Text>Trigger Error</Text>
      </TouchableOpacity>
    </View>
  );
}

function ErrorBoundaryExample() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to console
        console.error('Error caught:', error);
        console.error('Component stack:', errorInfo.componentStack);

        // Log to analytics (when implemented)
        // Analytics.logError(error, errorInfo);

        // Log to Sentry (when configured)
        // Sentry.captureException(error, {
        //   contexts: { react: { componentStack: errorInfo.componentStack } }
        // });
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}

// Custom fallback UI
function ErrorBoundaryWithCustomFallback() {
  return (
    <ErrorBoundary
      fallback={
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            Custom Error UI
          </Text>
          <Text>Something went wrong in this section</Text>
        </View>
      }
    >
      <MyComponent />
    </ErrorBoundary>
  );
}

// ============================================================================
// INTEGRATED EXAMPLE: Order Form with All Error Handling
// ============================================================================

function PlaceOrderIntegratedExample() {
  const toast = useToast();

  const handleSubmit = async (values: Record<string, string>) => {
    try {
      // Show loading state
      // setLoading(true);

      // Validate
      const amount = parseFloat(values.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.show('error', 'Invalid amount');
        return;
      }

      // API call with retry
      const result = await fetchWithRetry(
        async () => {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: values.amount }),
          });
          if (!response.ok) {
            throw new Error(`Failed to place order: ${response.status}`);
          }
          return response.json();
        },
        { maxRetries: 3, showRetryToast: true }
      );

      if (result.error) {
        toast.show('error', 'Failed to place order after retries');
        return;
      }

      // Success
      toast.show('success', 'Order placed successfully');
    } catch (error) {
      toast.show('error', 'Unexpected error occurred');
      console.error('Order error:', error);
    } finally {
      // setLoading(false);
    }
  };

  return (
    <FormValidator>
      {({ values, errors, handleChange, handleBlur, validateAll }) => (
        <View style={{ gap: 16, padding: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Place Order</Text>

          <InputWithError
            label="Amount"
            error={errors.amount}
            showError={!!errors.amount}
            value={values.amount || ''}
            onChangeText={handleChange('amount')}
            onBlur={handleBlur('amount')}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            onPress={() => {
              const isValid = validateAll();
              if (isValid) {
                handleSubmit(values);
              }
            }}
          >
            <Text>Place Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </FormValidator>
  );
}

// ============================================================================
// REACT HOOK INTEGRATION EXAMPLE
// ============================================================================

import { useQuery } from '@tanstack/react-query';

function useMarketsWithErrorHandling() {
  const toast = useToast();

  return useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const result = await fetchWithRetry(
        async () => {
          const response = await fetch('/api/markets');
          if (!response.ok) {
            throw new Error(`Failed to fetch markets`);
          }
          return response.json();
        },
        { maxRetries: 4, showRetryToast: true }
      );

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    onError: (error) => {
      toast.show('error', 'Failed to load markets');
      console.error('Markets query error:', error);
    },
  });
}
