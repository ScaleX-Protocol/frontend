/**
 * Detects if the app is running inside a miniapp environment
 * (e.g., Base app, Farcaster, etc.)
 */
export function isMiniappEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for common miniapp indicators
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // Check for Base app
  if (userAgent.includes('base') && userAgent.includes('miniapp')) {
    return true;
  }

  // Check for Farcaster frames
  if (window.parent !== window && userAgent.includes('farcaster')) {
    return true;
  }

  // Check if running in iframe with restricted APIs
  try {
    const isIframe = window.self !== window.top;
    const hasRestrictedAPIs = !window.navigator.standalone;
    
    if (isIframe && hasRestrictedAPIs) {
      return true;
    }
  } catch (e) {
    // Cross-origin iframe - likely a miniapp
    return true;
  }

  return false;
}
