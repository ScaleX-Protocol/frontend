import { useWallets } from "@privy-io/react-auth";
import { useChainValidator } from "./useChainValidator";
import { useMemo, useCallback } from "react";
import { WalletInfo, WalletStateReturn } from "@/types/wallet.types";
import { parseChainId } from "@/lib/wallet.helper";

const DEFAULT_EMBEDDED_CHAIN_ID = 1;
const DEFAULT_EXTERNAL_CHAIN_ID = 11155111;

export function useWalletState(): WalletStateReturn {
  const { wallets, ready } = useWallets();

  // Memoize wallet selections
  const embeddedWalletInstance = useMemo(
    () => wallets.find((w) => w.walletClientType === "privy"),
    [wallets]
  );

  const externalWalletInstance = useMemo(
    () => wallets.find((w) => w.walletClientType !== "privy"),
    [wallets]
  );

  const embeddedChainValidator = useChainValidator(embeddedWalletInstance);
  const externalChainValidator = useChainValidator(externalWalletInstance);

  // Memoize wallet info objects
  const embeddedWallet: WalletInfo = useMemo(
    () => ({
      wallet: embeddedWalletInstance,
      address: embeddedWalletInstance?.address || "Not Created",
      chainId:
        parseChainId(embeddedWalletInstance?.chainId) ||
        DEFAULT_EMBEDDED_CHAIN_ID,
      validation: embeddedChainValidator.validationResult,
    }),
    [embeddedWalletInstance, embeddedChainValidator.validationResult]
  );

  const externalWallet: WalletInfo = useMemo(
    () => ({
      wallet: externalWalletInstance,
      address: externalWalletInstance?.address || "Not Connected",
      chainId:
        parseChainId(externalWalletInstance?.chainId) ||
        DEFAULT_EXTERNAL_CHAIN_ID,
      validation: externalChainValidator.validationResult,
    }),
    [externalWalletInstance, externalChainValidator.validationResult]
  );

  // Memoize validation functions
  const validateEmbeddedChain = useCallback(async () => {
    if (!embeddedWalletInstance) return false;
    return embeddedChainValidator.ensureValidChain();
  }, [embeddedWalletInstance, embeddedChainValidator]);

  const validateExternalChain = useCallback(async () => {
    if (!externalWalletInstance) return false;
    return externalChainValidator.ensureValidChain();
  }, [externalWalletInstance, externalChainValidator]);

  // Manual validation function for both wallets
  const validateAllChains = useCallback(async () => {
    try {
      await Promise.all([
        embeddedWalletInstance
          ? validateEmbeddedChain()
          : Promise.resolve(false),
        externalWalletInstance
          ? validateExternalChain()
          : Promise.resolve(false),
      ]);
    } catch (error) {
      console.error("Error validating chains:", error);
    }
  }, [
    embeddedWalletInstance,
    externalWalletInstance,
    validateEmbeddedChain,
    validateExternalChain,
  ]);

  return {
    isReady: ready,
    embeddedWallet,
    externalWallet,
    validateEmbeddedChain,
    validateExternalChain,
    validateAllChains,
  };
}
