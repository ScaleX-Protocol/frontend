import { useEffect } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';

export function FrameReady() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return null;
}
