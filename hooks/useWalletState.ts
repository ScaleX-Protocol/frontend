import { useWallets } from "@privy-io/react-auth";

export function useWalletState() {
  const { wallets, ready } = useWallets();

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");

  const parseChainId = (chainId: string | undefined): number | undefined => {
    if (!chainId) return undefined;
    return parseInt(chainId.replace("eip155:", ""));
  };

  // If needed chain validator maybe we can place in this hook

  return {
    isReady: ready,
    embeddedWallet,
    externalWallet,
    embeddedAddress: embeddedWallet?.address || "Not Created",
    externalAddress: externalWallet?.address || "Not Connected",
    embeddedChainId: parseChainId(embeddedWallet?.chainId) || 31337,
    externalChainId: parseChainId(externalWallet?.chainId) || 31338,
  };
}
