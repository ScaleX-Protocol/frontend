/**
 * Detects if the device is mobile (phone or tablet)
 * Mobile devices use lightweight Recharts, desktop uses TradingView
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Check screen width (mobile if < 1024px)
  const isMobileWidth = window.innerWidth < 1024;

  // Check user agent for mobile devices
  const userAgent = window.navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'mobile',
  ];

  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

  // Return true if either screen width OR user agent indicates mobile
  return isMobileWidth || isMobileUA;
}
