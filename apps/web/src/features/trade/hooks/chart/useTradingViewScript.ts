import { useEffect, useState } from 'react';

let scriptLoadingPromise: Promise<void> | null = null;
let isScriptLoaded = false;

export function useTradingViewScript() {
  const [isLoaded, setIsLoaded] = useState(isScriptLoaded);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If already loaded, sync the state
    if (isScriptLoaded) {
      setIsLoaded(true);
      return;
    }

    // Check if script tag exists but flag wasn't set
    if (document.getElementById('tradingview-script')) {
      // Wait a bit for script to execute
      const checkInterval = setInterval(() => {
        if (window.TradingView) {
          isScriptLoaded = true;
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.TradingView) {
          setError(new Error('TradingView script loaded but object not available'));
        }
      }, 5000);
      return;
    }

    if (!scriptLoadingPromise) {
      scriptLoadingPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'tradingview-script';
        script.src = 'https://trading-view.scalex.money/charting_library/charting_library.standalone.js';
        script.async = true;

        script.onload = () => {
          // Wait for TradingView object to be available
          const checkInterval = setInterval(() => {
            if (window.TradingView) {
              isScriptLoaded = true;
              clearInterval(checkInterval);
              resolve();
            }
          }, 50);
          
          // Timeout after 3 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.TradingView) {
              reject(new Error('TradingView script loaded but object not created'));
            }
          }, 3000);
        };

        script.onerror = () => {
          const err = new Error('Failed to load TradingView library');
          reject(err);
        };

        document.head.appendChild(script);
      });
    }

    scriptLoadingPromise
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        setError(err);
      });
  }, []);

  return { isLoaded, loadError: error };
}
