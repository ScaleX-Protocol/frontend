/**
 * Sentry Configuration
 *
 * NOTE: Sentry is not currently installed in this project.
 * To enable Sentry integration:
 *
 * 1. Install @sentry/react-native:
 *    npm install @sentry/react-native
 *
 * 2. Update app.json or app.config.js with Sentry config
 *
 * 3. Uncomment the code below and add your DSN
 *
 * 4. For more info: https://docs.sentry.io/platforms/react-native/
 */

// Uncomment when Sentry is installed
// import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';
const SENTRY_ENABLED = false; // Set to true after installing and configuring Sentry

export function initSentry(): void {
  if (!SENTRY_ENABLED || !SENTRY_DSN) {
    console.log('Sentry is disabled or not configured');
    return;
  }

  // Uncomment when Sentry is installed
  // Sentry.init({
  //   dsn: SENTRY_DSN,
  //   debug: __DEV__,
  //   environment: __DEV__ ? 'development' : 'production',
  //   tracesSampleRate: 1.0,
  //   beforeSend(event) {
  //     // Filter out sensitive data
  //     if (event.request) {
  //       delete event.request.cookies;
  //     }
  //     return event;
  //   },
  // });
}

export function captureException(error: Error, context?: Record<string, any>): void {
  if (!SENTRY_ENABLED) {
    console.error('Exception:', error, context);
    return;
  }

  // Uncomment when Sentry is installed
  // Sentry.captureException(error, {
  //   extra: context,
  // });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!SENTRY_ENABLED) {
    console.log(`[${level.toUpperCase()}]`, message);
    return;
  }

  // Uncomment when Sentry is installed
  // Sentry.captureMessage(message, level);
}

export function setUser(userId: string, email?: string, username?: string): void {
  if (!SENTRY_ENABLED) {
    console.log('Set user:', { userId, email, username });
    return;
  }

  // Uncomment when Sentry is installed
  // Sentry.setUser({
  //   id: userId,
  //   email,
  //   username,
  // });
}

export function clearUser(): void {
  if (!SENTRY_ENABLED) {
    console.log('Clear user');
    return;
  }

  // Uncomment when Sentry is installed
  // Sentry.setUser(null);
}
