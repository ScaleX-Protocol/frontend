import type { ConnectedWallet } from '@privy-io/react-auth';
import { useCallback, useMemo } from 'react';
import { useConfig, useSwitchChain } from 'wagmi';
import type { ChainValidationResult, ChainValidatorReturn } from '@scalex/types';

// Simple logger for platform-agnostic code
const logger = {
  error: (...args: any[]) => console.error(...args),
};

export function useChainValidator(wallet: ConnectedWallet | undefined): ChainValidatorReturn {
  const config = useConfig();
  const { switchChain } = useSwitchChain();

  const supportedChains = config.chains;
  const supportedChainIds = useMemo<number[]>(() => supportedChains.map((chain) => chain.id), [supportedChains]);

  const validateChain = useCallback(
    (chainId: number): ChainValidationResult => {
      const isSupported = supportedChainIds.includes(chainId);

      return {
        isValid: isSupported,
        needsSwitch: !isSupported && supportedChainIds.length > 0,
        currentChainId: chainId,
      };
    },
    [supportedChainIds],
  );

  const ensureValidChain = useCallback(async (): Promise<boolean> => {
    if (!wallet) return false;

    const chainId = wallet.chainId ? Number(wallet.chainId.replace('eip155:', '')) : undefined;

    if (!chainId) return false;

    const validation = validateChain(chainId);

    // If chain is already valid, no action needed
    if (validation.isValid) return true;

    // If chain needs to be switched and we have supported chains
    if (validation.needsSwitch && supportedChains.length > 0) {
      const targetChain = supportedChains[0];
      try {
        // switchChain automatically handles adding the chain if it doesn't exist
        // No need for separate addChain call
        await switchChain({ chainId: targetChain.id });
        return true;
      } catch (error) {
        logger.error('Failed to switch chain', error, {
          hook: 'useChainValidator',
          targetChainId: targetChain.id
        });
        return false;
      }
    }

    return false;
  }, [wallet, validateChain, supportedChains, switchChain]);

  const currentChainId = useMemo<number | undefined>(() => {
    if (!wallet?.chainId) return undefined;
    return Number(wallet.chainId.replace('eip155:', ''));
  }, [wallet]);

  const validationResult = useMemo<ChainValidationResult>(() => {
    if (!currentChainId) {
      return {
        isValid: false,
        needsSwitch: false,
      };
    }
    return validateChain(currentChainId);
  }, [currentChainId, validateChain]);

  return {
    validationResult,
    ensureValidChain,
  };
}
